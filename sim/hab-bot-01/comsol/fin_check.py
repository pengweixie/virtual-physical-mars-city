# Independent analytic cross-check for hip_thermal.java (dual-method discipline).
# Square-tube fin theory: the thigh is a fin of perimeter P, section A_c,
# length L, with combined h on its outer surface. Compare against FEM case A.
import math

k = 167.0
h = 5.0 + 5.65          # conv + linearized rad (L1's value, for comparison only)
P_fin = 4 * 0.08        # tube perimeter
A_c = 0.08**2 - 0.074**2
L = 0.38
m = math.sqrt(h * P_fin / (k * A_c))
mL = m * L
eta = math.tanh(mL) / mL
print(f"fin parameter m = {m:.2f} 1/m, mL = {mL:.2f}")
print(f"fin efficiency eta = {eta:.3f}  (L1 assumed 1.000)")

# effective UA with housing area A_j and finned thigh
A_j = 0.0486            # housing exterior (box, minus tube footprint)
A_t = P_fin * L         # 0.1216
UA_iso = h * (A_j + A_t)
UA_fin = h * (A_j + eta * A_t)
P_hip = 22.92
print(f"UA isothermal {UA_iso:.3f} vs finned {UA_fin:.3f} W/K")
print(f"dT source: iso {P_hip/UA_iso:.1f} K vs finned {P_hip/UA_fin:.1f} K "
      f"(L1 said 15.7 K on its own areas)")
