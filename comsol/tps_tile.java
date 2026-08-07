import com.comsol.model.*;
import com.comsol.model.util.*;

/** veh-rocket-01 防热瓦再入瞬态传热(L3, COMSOL 6.3 headless)
 *  1D 叠层:陶瓷纤维瓦(Lt, 扫 3/5/8 cm) + 4 mm 不锈钢壁。
 *  前表面 BC:q_net = qfun(t) - eps*sigma*(T^4 - Tamb^4)
 *    qfun = sim_entry 标称 γe=-13° 的 Sutton-Graves 热流史(688 行文件)。
 *  背面绝热(最恶劣);初温 210 K。判据:钢壁峰温 < 800 K(不锈钢强度保持)。
 *  材料取文献量级:瓦 k=0.12 W/mK, rho=350, cp=900;钢 k=20, rho=7900, cp=550。 */
public class tps_tile {
  public static void main(String[] args) {
    run();
  }

  public static Model run() {
    Model model = ModelUtil.create("Model");
    model.param().set("Lt", "0.05[m]");
    model.param().set("Tamb", "210[K]");
    model.param().set("eps_s", "0.85");

    model.func().create("int1", "Interpolation");
    model.func("int1").set("source", "file");
    model.func("int1").set("filename", "E:\\Claude\\mars\\comsol\\qdot_entry.txt");
    model.func("int1").setIndex("funcs", "qfun", 0, 0);
    model.func("int1").setIndex("funcs", "1", 0, 1);
    model.func("int1").set("argunit", new String[]{"s"});
    model.func("int1").set("fununit", new String[]{"W/m^2"});
    model.func("int1").set("interp", "linear");
    model.func("int1").set("extrap", "const");

    model.component().create("comp1", true);
    model.component("comp1").geom().create("geom1", 1);
    model.component("comp1").geom("geom1").create("i1", "Interval");
    model.component("comp1").geom("geom1").feature("i1").set("p1", "0");
    model.component("comp1").geom("geom1").feature("i1").set("p2", "Lt");
    model.component("comp1").geom("geom1").create("i2", "Interval");
    model.component("comp1").geom("geom1").feature("i2").set("p1", "Lt");
    model.component("comp1").geom("geom1").feature("i2").set("p2", "Lt+0.004");
    model.component("comp1").geom("geom1").run();

    model.component("comp1").physics().create("ht", "HeatTransfer", "geom1");
    // 域1:陶瓷瓦
    model.component("comp1").physics("ht").feature("solid1").set("k_mat", "userdef");
    model.component("comp1").physics("ht").feature("solid1").set("k", "0.12[W/(m*K)]");
    model.component("comp1").physics("ht").feature("solid1").set("rho_mat", "userdef");
    model.component("comp1").physics("ht").feature("solid1").set("rho", "350[kg/m^3]");
    model.component("comp1").physics("ht").feature("solid1").set("Cp_mat", "userdef");
    model.component("comp1").physics("ht").feature("solid1").set("Cp", "900[J/(kg*K)]");
    // 域2:不锈钢壁
    model.component("comp1").physics("ht").create("solid2", "SolidHeatTransferModel", 1);
    model.component("comp1").physics("ht").feature("solid2").selection().set(new int[]{2});
    model.component("comp1").physics("ht").feature("solid2").set("k_mat", "userdef");
    model.component("comp1").physics("ht").feature("solid2").set("k", "20[W/(m*K)]");
    model.component("comp1").physics("ht").feature("solid2").set("rho_mat", "userdef");
    model.component("comp1").physics("ht").feature("solid2").set("rho", "7900[kg/m^3]");
    model.component("comp1").physics("ht").feature("solid2").set("Cp_mat", "userdef");
    model.component("comp1").physics("ht").feature("solid2").set("Cp", "550[J/(kg*K)]");
    // 初温
    model.component("comp1").physics("ht").feature("init1").set("Tinit", "Tamb");
    // 前表面:气动热流 - 再辐射(表达式,不依赖 HT 模块辐射特征)
    model.component("comp1").physics("ht").create("hf1", "HeatFluxBoundary", 0);
    model.component("comp1").physics("ht").feature("hf1").selection().set(new int[]{1});
    model.component("comp1").physics("ht").feature("hf1")
         .set("q0_input", "qfun(t) - eps_s*5.670374419e-8[W/(m^2*K^4)]*(T^4 - Tamb^4)");

    model.component("comp1").mesh().create("mesh1");
    model.component("comp1").mesh("mesh1").create("e1", "Edge");
    model.component("comp1").mesh("mesh1").feature("e1").create("size1", "Size");
    model.component("comp1").mesh("mesh1").feature("e1").feature("size1").set("hmax", "0.5[mm]");
    model.component("comp1").mesh("mesh1").run();

    model.study().create("std1");
    model.study("std1").create("time", "Transient");
    model.study("std1").feature("time").set("tlist", "range(0,10,3000)");

    double[] thk = {0.03, 0.05, 0.08};
    for (double L : thk) {
      model.param().set("Lt", L + "[m]");
      model.component("comp1").geom("geom1").run();
      model.component("comp1").mesh("mesh1").run();
      model.study("std1").run();

      model.result().numerical().create("pevF", "EvalPoint");
      model.result().numerical("pevF").selection().set(new int[]{1});
      model.result().numerical("pevF").set("expr", new String[]{"T"});
      double[][] TF = model.result().numerical("pevF").getReal();
      model.result().numerical().create("pevB", "EvalPoint");
      model.result().numerical("pevB").selection().set(new int[]{3});
      model.result().numerical("pevB").set("expr", new String[]{"T"});
      double[][] TB = model.result().numerical("pevB").getReal();
      double maxF = 0, maxB = 0;
      for (double[] row : TF) for (double v : row) if (v > maxF) maxF = v;
      double tPeakB = -1;
      for (int i = 0; i < TB.length; i++)
        for (int j = 0; j < TB[i].length; j++)
          if (TB[i][j] > maxB) { maxB = TB[i][j]; tPeakB = 10.0*Math.max(i, j); }
      System.out.println("RESULT Lt=" + (L*100) + "cm  surfPeak=" + Math.round(maxF)
          + "K  wallPeak=" + Math.round(maxB) + "K  wallPeak@t~" + Math.round(tPeakB) + "s");
      model.result().numerical().remove("pevF");
      model.result().numerical().remove("pevB");
    }
    System.out.println("CRITERION: wallPeak < 800 K (stainless retains strength)");
    return model;
  }
}
