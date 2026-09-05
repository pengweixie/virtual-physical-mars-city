# Pre-registered reading rule for the tokamak leakage chain result

Author: sci-rad-01. Archived by 总控 before the segmented leakage chain
(pwr-fusion-01, stage 1 in progress at archive time) has delivered a
value. The commit time of this file is the ordering evidence; the object
being predicted does not yet exist.

## Inputs fixed at archive time

- Criterion: increment B = 0.1945 mSv/yr at the worst village receptor.
- Worst receptor: living_A1 via the airlock door path, x_solid 104.9 g/cm2
  (berths_paths_v5r3.json, v5-paths-r3, rerun 2026-09-02T03:49:53.266Z).
- Ratio of worst receptor to the design-assumption reference: 5.105 at
  a_dose 0.679 (dry, fast incidence; conservative end), 2.586 at a_dose
  0.344 (15% water, 10 MeV; permissive end). Albedo matrix frozen by
  sha256 manifest (ALBEDO_DELIVERY.md section 7).
- The ratio is dimensionless. It becomes a dose only when multiplied by
  the source term. The 2.58e3 mSv/yr quoted earlier for the reference is a
  product of the 68,000x-loose source bound, not a property of the
  reference.

## Reading rule

Let D_ref be the design-assumption dose the chain result implies, in
mSv/yr, at the receptor distance.

| D_ref | verdict |
|---|---|
| < 0.038 mSv/yr | whole village passes at the conservative end (a_dose 0.679) |
| 0.038 to 0.075 | verdict depends on which end of a_dose applies, i.e. on the leakage spectrum |
| > 0.075 mSv/yr | fails even at the permissive end (a_dose 0.344) |

## Qualification gate, answered before any dose is computed

The chain must resolve the escape fraction to 2.2e-10 per source neutron
(the level at which B is met), or deliver a bound tight to that level.
The first report on the chain result answers only "resolved to 2.2e-10 or
not". A dose figure computed from an unresolved result would still look
like a result and would be cited; the gate gives the number its
qualification before it exists.

## Declared conservative choices in the conversion

Isotropic point source; no atmospheric attenuation (0.28 g/cm2, negligible
for neutrons); h taken at 1 MeV (410 pSv cm2, near the maximum). Angular
distribution and spectrum from the chain would move all three downward.

## Not stamped here

S_n = 2.27e20 n/s on the 640 MW basis is copied from the tokamak reply and
awaits the producer's certification of the current design power.

## Addendum, same day, still before the chain delivers: which surface

The producer certified the bound inputs on the current operating point
(S_n = 2.271e20 n/s at P_fus 640 MW; escape < 1.5e-5 per source neutron,
200k histories, 3/N one-sided) and named the surface: **r = 4.235 m,
cryostat exterior, no bio-shield**. It expects the true escape there in
the 1e-6 to 1e-5 range, so the bound is loose by 2-10x, not 68,000x.

That surface cannot meet 2.2e-10; the four to five decades between the
cryostat exterior and the criterion are the bio-shield's job. The chain
will also report at each 0.5 m concrete surface outside the cryostat.
The reading rule therefore applies per surface:

- D_ref(t) is the design-assumption dose implied by the chain result at
  the exterior of t metres of concrete.
- The qualification gate ("resolved to 2.2e-10 or a bound tight to it")
  is asked at the outermost concrete surface delivered, not at 4.235 m.
- The bio-shield thickness the city requires is the smallest t with
  D_ref(t) < 0.038 mSv/yr (conservative albedo end). If the chain resolves
  the crossing only as a bracket, the requirement is the upper end of the
  bracket. This is a design output, not a failure of the village.
- The village geometry stays frozen until t is fixed; the village-side
  path thicknesses are judged against D_ref at the fixed t.

The bio-shield is a city requirement (control point pwr-grid-01); the
producer's ledger currently declares no thickness. Whatever t the chain
implies becomes the declared input, versioned like the others.

## Second addendum, before the chain delivers: two qualifications on a_dose

- The albedo matrix was produced with the pre-normalisation regolith
  composition (mass fractions summing to 0.96, nucleon density 4% low).
  The producer fixed the source and deliberately did not rerun, keeping
  the provenance. Direction: a thinner medium returns slightly less, so
  the true a_dose may sit slightly above 0.679. Small against the
  0.344-0.679 span, not zero, and unfavourable.
- [0.344, 0.679] is an envelope over all incident energies and moisture,
  not the device's a_dose. The device value needs the leakage spectrum and
  angular distribution, which the chain delivers. When it lands,
  sci-rad-01 collapses the envelope to one number; the interval narrows,
  direction unknown. The reading table above is stated for the envelope
  ends and remains valid as bounds.
- Baseline alignment verified before data: sci-rad-01 checked the matrix
  manifest (78/78 files, manifest hash fde39e1e...) and every fixed input
  in this file against its own ledger. Both parties read from the same
  bytes.

## Third addendum, before the chain delivers: the requirement in decades

D_ref(0) at the shield exterior, recomputed on the certified S_n:

| escape per source n | leakage n/s | D_ref(0) mSv/yr | decades to 0.038 |
|---|---|---|---|
| 1.5e-5 (current bound) | 3.41e15 | 2749 | 4.86 |
| 1.0e-6 (producer's expected low end) | 2.27e14 | 183 | 3.68 |

The requirement is 3.7-4.9 decades, depending on where the chain pins
the escape. It is stated in decades, not metres: converting to metres
needs a concrete attenuation length with a provenance, and the chain
supplies the per-0.5 m attenuation factor as a measurement, so t becomes
one division with no sourced-by-hearsay constant. The producer is asked
to deliver per-surface attenuation factors, not equivalent thicknesses.

Distance correction: the emitting surface moves toward the village as t
grows (t = 3 m gives +4.6% by 1/r^2). Unfavourable, negligible, recorded
because it opposes the attenuation term and omitting it biases t low.

Arrival report is three lines, in order: resolved to 2.2e-10 at the
outermost concrete surface or not; the device a_dose collapsed from the
envelope with its spectrum and angular source; the D_ref(t) table with
the smallest t under 0.038.

## Consistency note, before the chain delivers

The two forms of the requirement - escape <= 2.2e-10 per source neutron at
the shield exterior, and 4.86 decades of concrete below the cryostat
bound - are one inequality written from both ends: at any starting
escape, the residual after the required decades is 2.08e-10. "At least
5 decades" is the smallest integer that covers it from the current bound
(residual 1.5e-10); 4 decades leaves 1.5e-9, short by 6.8x. Closeness in
decades is not closeness in dose.

## Suspicion threshold for the attenuation rate, written before the chain

From the two reference points (2.475 m: 174/300k; 2.775 m: 29/300k) the
first measured attenuation rate is 6.00x over 0.30 m = 2.59 +/- 0.29
decades per metre (Poisson, 29 counts in the denominator). Three
qualifiers travel with it: measured in the vacuum-vessel steel region,
not concrete; a two-point ratio; one segment, and the chain exists
because segments differ. It is an order-of-magnitude check, not an
answer. At that rate 4.86 decades would need 1.87 m.

Expectation: the bio-shield attenuation rate falls in the range 1-6
decades per metre. Below 1 means the material is far worse than steel,
implausible for hydrogen-bearing concrete; above 6 means an order of
magnitude better than steel, possible with boron or high water content
but requiring an explanation. If the chain reports outside this range,
suspect the chain first, not the shield thickness.

Repository copy of chain2/progress.log still shows the run that died
(STARTED 00:07:30Z, last line step0 write at 00:53:59Z, file mtime
04:14Z). The restarted run is visible only on the VM. The 06:30Z estimate
is accepted from the producer, not verified here; the STARTED marker is
doing exactly its job by making the stale copy recognisable.

## Material declared before the extension reports

The extension segments are borated concrete, 0.5 m per step behind a
0.30 m buffer, stopping on cumulative T <= 2.2e-10 with at least 18
records on the last surface (cap 19 layers). This is a declared input
for the city bio-shield (control point pwr-grid-01) and will be carried
with its recipe and version. The 1-6 decades/m expectation above was
written for ordinary concrete; boron raises thermal absorption, so a
rate above 6 in these segments is the pre-registered material reason,
not a chain fault. sci-rad-01 is asked to restate the band for borated
concrete now, before data, or to record boron as the registered
exception. The zero of t must match the producer's definition of
whether the buffer counts.

## Provenance of the 91.4% figure: not closed

The producer's record for 17:30-17:39Z on 2026-08-31 has no entry at
17:33:26Z; the compaction boundary that day is 13:01Z, so the gap is in
verbatim text, not a summary. The density-scan table in the message has
the same design as its gate_albedo.sh but different values (0.7728 at
5 m against its measured 0.8259). Conclusion: not any run in that
record. Recorded as "provenance not closed, content withdrawn". No
further pursuit.

## Boron is not a registered exception; t = 0 defined

The 1-6 decades/m band stands for the neutron channel in borated
concrete. Reason, structural: deep-penetration attenuation is set by
fast-neutron removal; boron absorption is 1/v and acts on thermal
neutrons; dose weighting (h*(10) ~10.6 thermal vs ~410 at 1 MeV, 39x per
neutron) makes the fast tail the deep dose carrier, and boron does not
touch it. Boron displaces hydrogen-bearing material by a few mass
percent, so if it moves the fast rate at all it moves it slightly down.
What boron suppresses is the thermal flux and the H(n,gamma) 2.2 MeV
capture-gamma source. Order of magnitude: ordinary concrete fast
removal length ~11-12 cm gives ~3.8 decades/m, mid-band. A neutron rate
above 6 is therefore still "suspect the chain first". A pre-registered
exception is honest only when the mechanism produces the effect;
otherwise it is an escape hatch built in advance.

Consequence for the deliverable: capture gammas are the real deep dose
contributor in hydrogenous shielding. The chain must report photons at
each surface alongside neutrons, or state that the photon channel is
not covered.

t = 0 is r = 4.235 m, the surface where escape is defined. Everything
outside it: if material, counts toward attenuation regardless of its
name; material or not, counts toward radius and hence 1/r^2. The 0.30 m
buffer enters by its composition and density, not by the word "buffer".

The 91.4% provenance will never close, and the conclusion does not
depend on it: the finding is "the matrix says otherwise", not "91.4% was
wrong". A relayed number replaced by data needs no source to be
replaced. Tracing sources prevents recurrence; it does not gate the
withdrawal.

## Producer's answers on t and the recipe (before the chain reports)

- t = r_face - 4.235 m; surface k >= 6 has t_k = 0.5 (k - 5) m.
- The 0.30 m "buffer" does not enter t: in read mode it is built on the
  inner side of each cut face as a re-representation of upstream
  material already in the stack (segment 6: 0.06 m cryostat steel;
  from segment 7: the previous 0.30 m of concrete). It adds no
  thickness; it exists so that neutrons turning back at the face have
  something to rescatter in (53% were otherwise killed at the face,
  measured). Consistent with the t = 0 rule above: it is material, and
  it is already counted once.
- Borated concrete, read from stage.cc lines 138-143 (sha256 0d6e9e64...):
  G4_CONCRETE 0.97 + G4_BORON_CARBIDE 0.03 by mass; boron mass fraction
  0.0235; fractions sum 1.000 (mat031 silent, G4Exception count 0).
  Density 2.35 g/cm3 is self-set with no provenance and is listed as
  such in the producer's TVL_measurements section 6.2 - an unsourced
  declared input, carried as one.
- No water content is reported; the model has only the NIST G4_CONCRETE
  element table. Hydrogen mass fraction will come from a matdump run
  (materials built, no physics) and be cross-checked against the
  stage.cc literals by the generator, since the recipe now exists in two
  places.
- Material version stamp = stage.cc sha256; every chain step uses the
  same binary (VM sync 9/9), so material version = chain version.
- The generator marks decades/m against the 1-6 band as sci-rad-01's
  pre-registered value and prints "suspect the chain first" outside it;
  it does not alter the band.

## Photon channel: why it cannot be derived from the neutron channel

Capture gammas are a source distributed inside the shield, not an
external source the shield attenuates. The gamma flux at the outer
surface is fed by captures within the last few gamma attenuation lengths
and does not fall with the full thickness t. Neutron transmission drops
from 0.51 at t = 0.5 m to 0.017 at 3.0 m while the gamma term stays
tied to the last ~22 g/cm2. The two channels do not scale together, so
a neutron-only D_ref(t) can be arbitrarily wrong at large t and the
error grows with thickness - the opposite of the usual behaviour of an
omitted term. It cannot be dismissed as small.

Consequences:
- D_ref(t) is labelled "neutron channel; photon channel not covered,
  error growing with t". If the chain delivers neutrons only, the table
  still yields a lower bound on the required t. Direction certain,
  magnitude unknown.
- The producer is asked to report photons per surface separately from
  neutrons, and to label them transported versus generated in the
  segment. A source generated inside a segment is not helped by
  thickening upstream, only downstream, so the two channels may answer
  "which segment to thicken" oppositely - and t depends on that answer.
- The albedo matrix's ALB_G rows (g/n = 0.207 over 72 files) answer a
  different question - half-space backscatter from regolith - and are
  not used as a substitute.
- Boron, refused as an exception for the neutron rate, is exactly what
  suppresses this source (B-10(n,alpha) 0.48 MeV replacing H(n,gamma)
  2.2 MeV). The design choice was right; its benefit sits in the channel
  that was not yet being counted. An argument correct in what it denies
  has not necessarily considered everything it should.

## Shield composition, printed by Geant4 (matdump.cc, materials only)

BoratedConcrete as used by the chain, density 2.35 g/cm3 (self-set; the
only unsourced number in the recipe), mass fractions: H 0.0097, C 0.0075,
O 0.5132, Na 0.0155, Mg 0.0019, Al 0.0329, Si 0.3269, K 0.0126, Ca 0.0427,
Fe 0.0136, B 0.0235; sum 1. Basis NIST G4_CONCRETE (rho 2.3, H 0.010) at
0.97 plus NIST G4_BORON_CARBIDE (B 0.7826, C 0.2174) at 0.03. The model
has no "water", only hydrogen: any declaration states H 0.97 wt%, not a
converted water content, since the conversion would add an assumption
the model does not contain. Boron fraction agrees with the arithmetic
value from the source literals (two sources cross-checked). Material
stamp: stage.cc sha256 0d6e9e64...; matdump_out.txt ships with the
delivery.

## Reading bands for the neutron attenuation rate, paired, before data

| decades per metre | reading |
|---|---|
| > 6 | suspect the chain first (boron is not a sufficient explanation - ruled) |
| 2.5 - 6 | in band, normal |
| 1 - 2.5 | in band, low: explained by the dry recipe (NIST concrete, ~1% H, no added water); do not suspect the chain |
| < 1 | suspect the chain first |

Basis: boron carbide at 3% displaces 3% of the hydrogen, moving the
expected ~3.8 decades/m down by ~0.11 - inside the band, in the
direction predicted. The larger effect is that the recipe is dry
concrete; shielding concrete is often specified wetter, and lower
hydrogen means weaker fast-neutron removal. The low-end explanation is
registered now for the reason symmetric to the refusal of the boron
exception: there the mechanism does not produce the effect, here it
does. Whether a pre-registered explanation is honest depends on the
physics, not on the wish to leave room.

Boron fraction cross-checked by hand: 0.03 x 43.24/55.25 = 0.02348,
reported 0.0235, match. Density: producer uses 2.35, the village path
table uses 2.30, both unsourced and of common-knowledge origin; they
are not treated as corroborating each other and are not unified.

## Composition verified element by element; a design interaction noted

Every reported fraction is reproduced from 0.97 x NIST concrete + 0.03 x
boron carbide, including carbon, the one element fed by both sources
(0.0010 + 0.0065 = 0.0075), which is the cell most easily transcribed
wrong and least easily noticed. Sum 1.0000.

Design interaction, recorded as a reading rule, not a recipe change:
boron captures thermal neutrons; dry concrete (0.97 wt% H) moderates
slowly, so the thermal population is smaller; boron therefore has less
to capture, and the capture-gamma source is weaker anyway because there
are fewer captures. The two choices partly cancel rather than add; net
direction unknown. Consequence: a weaker-than-expected photon channel
has two explanations - fewer captures from the dry recipe, or boron
working - and they give opposite advice on whether boron is needed.
Distinguishing them requires the thermal-neutron flux at the surface,
not the photon count itself. The producer's photon report should
therefore be accompanied by the thermal-group neutron count at the same
surface, which the 18-group table already provides.

Unit rule adopted citywide: do not convert a quantity into the units of
an object the model does not contain. Reporting 0.97 wt% H as "about
8.7% water" would assert bound-hydrogen scattering behaviour that is
not in the model. The conversion leaves the number unchanged and adds
a false claim about the model that the number does not carry. Paired
with "a labelled fraction cannot be transmitted": there the label's
boundary was lost, here the unit implies a non-existent object.

The structural argument for the photon channel (an internal source does
not fall with t) survives this composition change unchanged; a numeric
estimate of the gamma share would have been voided with the recipe.

## Photon channel: one of the two columns exists

The chain transmits only neutrons across cut faces (stage.cc line 573:
gammas are scored at the segment's outer boundary, SPEC_G, 12 log groups
1e-3 to 12 MeV, and are not written into the face source). So the
per-surface photon tally equals photons generated in the segment plus
its 0.30 m inner re-representation zone and leaving through the face.

| column | status |
|---|---|
| photons transported from further upstream | not available - faces do not carry photons |
| photons generated in the segment and leaving the face | available: counts, 12-group spectrum, n/s = S_n x T(segment entry) x per-launch count |

Two qualifiers travel with the available column:
1. "The segment" is 0.30 m wider than t_k defines: capture gammas born in
   the re-representation zone physically belong to the previous layer
   and are counted at this face. That zone is the last few gamma
   attenuation lengths - the main contributor - so it is inside, not
   missing.
2. Photons born further upstream than 0.30 m inside the face and
   reaching it are not counted; they cross at least 0.8 m more material.
   The per-face photon value is therefore a lower bound. The producer
   gives no coefficient for the missing part (that would be a fit);
   sci-rad-01 may cap it with its own gamma attenuation length.

Smoke magnitude (shield segment + LiPb zone, 5000 launches): 9/5000 =
1.8e-3 photons out per launched neutron. The delivery's line after the
resolution gate reads "photon channel: generated column covered,
transported column not covered".

Inner-face material, by substance: segment 6 has the 0.06 m cryostat
steel (NIST stainless, rho 8.0, Fe 0.746 / Cr 0.169 / Ni 0.085, printed),
already counted in segment 5's transmission and inside t = 0; from
segment 7 the previous layer's last 0.30 m of borated concrete, already
counted in the previous segment. No gaps between layers; radius is
exactly 4.235 + 0.5 (k - 5). Each piece of material is counted once, in
its own segment.

Four-band rate flag implemented in the generator as pre-registered.

## Correction: the discriminator is a ratio, not a count

The earlier rule named the thermal-neutron count as the quantity that
separates "boron working" from "dry recipe, few captures". It does not:
both cases give a low thermal group and a weak photon channel. A rule
that names a quantity taking the same value in the two cases it is meant
to separate looks like a discriminator and is a constant.

Shape separates them. If boron is working, neutrons do slow down and
boron eats the thermal tail: the epithermal group is present and the
thermal group is cut, a step at the thermal/epithermal boundary. If the
recipe is dry, neutrons barely slow: thermal and epithermal are low
together. The discriminator is the thermal/epithermal ratio.

In the 18-group table (log-equal 1e-9 to 20 MeV): thermal = g0-g4
(1.0e-9 to 7.3e-7 MeV), epithermal = g5-g12 (7.3e-7 to 2.8e-2 MeV),
fast = g13 up. The photon report is accompanied by sum(g0..g4) and
sum(g5..g12) at the same surface - two sums over existing columns, no
new tally.

Scope: the discriminator is used only in the branch where the photon
channel is in fact weak. If it is not weak, neither explanation applies
and the question is different (for instance whether the gamma source is
inelastic rather than capture). A discriminator is valid only in the
branch that triggers it.

## Photon channel: the missing transported column, bounded before data

Counted source region per face = 0.5 m segment + 0.30 m inner zone =
0.8 m upstream. With x the depth upstream of the scoring face, the
neutron flux (photon source) grows inward as exp(+x/lambda_n) and the
photon escape falls as exp(-x/lambda_gamma), so the missing fraction is
exp(-0.8 m x (1/lambda_gamma - 1/lambda_n)), valid only when
lambda_gamma < lambda_n.

| lambda_gamma cm | lambda_n cm | missing |
|---|---|---|
| 7.0 | 11.4 | 1.2% |
| 9.56 | 11.4 | 25.9% |
| 9.56 | 15.0 | 4.8% |
| 9.56 | 8.0 | diverges |
| 12.0 | 11.4 | diverges |

Central values (both unsourced): lambda_gamma 9.56 cm (2 MeV photons in
2.35 g/cm3 concrete, mu/rho ~ 0.0445), lambda_n 11.4 cm (3.8 decades/m).
The divergence is physical: when lambda_gamma >= lambda_n the source
grows inward faster than photons attenuate, deep material dominates,
and the counted share tends to zero. That boundary lies inside the
plausible range. So the missing share is [1%, divergent], not 26%, and
cannot be sealed to a number before the chain measures lambda_n.

Closure rule, written before the chain: the chain reports decades/m per
face, which gives lambda_n directly.
- lambda_n > ~9.6 cm (decades/m < 4.5): the missing column can be
  sealed at roughly 1-26% and the generated column represents the face.
- lambda_n <= ~9.6 cm (decades/m >= 4.5): deep contributions dominate,
  the generated column does not represent the face's photons, and the
  photon scoring must be redesigned.
The 1-6 decades/m neutron band straddles 4.5: which half the chain
lands in decides whether the photon channel can be closed.

The producer's refusal to supply a coefficient for the missing part is
endorsed by this result: a fitted coefficient would have reported
"missing 26%" and hidden the divergence, which is the only important
thing here. A fit reports a possibly unbounded quantity as a finite
number - the most dangerous use of a fit.

The smoke figure 1.8e-3 photons per launched neutron is accepted as a
lower bound for that geometry and is not quoted as a ratio.

## Band sums implemented from the printed group edges

The producer's generator adds, beside each face's photon table, the
sums of the existing 18-group neutron tally: thermal g0-g4 (<= 7.27e-7
MeV), epithermal g5-g12 (7.27e-7 to 0.0275 MeV), fast g13-g17. Edges
are read from the chain log, not copied; 18 log-equal groups over
1e-9 to 20 MeV give a factor of 3.735 per group, and the g4 and g12
upper edges reproduce the values above. The thermal/epithermal ratio is
printed with Poisson error when both bands have counts; when the
thermal band has zero counts it is printed as "< 3/N_epithermal" (95%
one-sided), never as 0.000 +/- 0.000 - a zero count's uncertainty is
not zero. Synthetic example: thermal 0, epithermal 11 -> "< 0.273".
Used only in the weak-photon branch; not part of the main conclusion.

## Photon closure rule, revised: the hardest line decides

Thermal capture in this recipe is almost entirely on boron: B 0.0552
g/cm3 (3.08e21/cm3, sigma_a ~767 b, Sigma_a 2.36/cm) against H 0.0228
g/cm3 (1.36e22/cm3, sigma_a ~0.33 b, Sigma_a 0.0045/cm), ratio ~520.
Cross sections are background knowledge without provenance, but the
argument needs only the ordering, which survives a factor of ten. So
the H(n,gamma) 2.223 MeV line is essentially absent and capture gammas
are B-10's 0.478 MeV, whose lambda_gamma ~4.9 cm would leave only
0.009% of the transported column uncounted.

That does not close the column. Fast neutrons deep in the shield - the
ones that get through - scatter inelastically on Si, O, Ca, Fe and emit
1-2 MeV gammas. Boron has no effect on that branch, and its
lambda_gamma ~9.6 cm is what governs the missing share, because the
hardest line travels farthest. Boron changes the amplitude and energy
of capture gammas; it does not change the criterion. Before asking
whether a mechanism helps, ask which quantity it acts on and whether
that quantity is load-bearing.

Revised closure rule (replaces the earlier one):

| chain lambda_n | missing transported column |
|---|---|
| > 9.6 cm (< 4.5 decades/m) | sealable at ~26% (inelastic gammas; capture contribution negligible) |
| <= 9.6 cm (>= 4.5 decades/m) | divergent; the generated column does not represent the face; scoring must be redone |

The boundary is still 4.5 decades/m, and the missing share is now a
number rather than a range because lambda_gamma is fixed near 9.6 cm by
the inelastic line and no longer floats with the capture line.

Remaining debt: the mean inelastic gamma energy (taken as 1-2 MeV). The
chain's 12-group photon spectrum retires it. The photon spectrum is
therefore a required column, not optional.

## Scope of the 4.5 decades/m mark: concrete faces only

The rule above was pre-registered for concrete faces. Heavy segments
(WC-B4C shield, vessel steel, windings, cryostat) remove fast neutrons
quickly and will show rates far above 4.5 decades/m; that is not a
signal to redesign photon scoring. Non-concrete faces report numbers
only and print "non-concrete segment, rule not applicable"; concrete
faces carry the mark. Marking only, no mid-run change. The "previous
face" for the first chain segment is the stage-one cut face, radius
read from ch_step0.log (RESULT r_cut_m = 2.355), not assumed.

Producer's stated reason for refusing a missing-part coefficient,
recorded: the interval is [1%, divergent]; a coefficient has no domain
of definition, so refusing it is not caution.

## Discriminator, second revision: epithermal/fast, not thermal/epithermal

The two explanations act on different properties of the spectrum.
Boron working is an absorption effect: moderation is normal, the
thermal tail is eaten, so epithermal/fast is normal and thermal/
epithermal is low. Dry concrete is a moderation effect: neutrons barely
slow, so epithermal/fast is low and thermal/epithermal is low as well.
Thermal/epithermal is low in both cases - the same failure as the
thermal count one level up. The separating quantity is epithermal/fast:
sum(g5..g12) over sum(g13..g17). Both are well populated, since fast is
the transmitted channel and epithermal is fed by it, so the ratio costs
nothing when the thermal band is zero.

Required columns beside the photon row: sum(g5..g12) and sum(g13..g17)
as the primary discriminator; sum(g0..g4) kept as a confirmation column.
Thermal/epithermal cannot discriminate on its own but confirms
absorption once epithermal/fast has established normal moderation; as
a confirmation the "< 3/N" upper bound is sufficient.

A discriminator has two independent failure modes and must pass both
checks: does it separate the cases (substitute each case and compare),
and can it be measured (ask how many counts each component has). In
this round the first check caught one party's error and the second
caught the other's; both fixes came from the other party looking along
a dimension the author had not, not from more care.

## Photon spectrum promoted to a gate line

Because its status changed from "present" to "required", the 12-group
photon spectrum now appears in the delivery's gate-line table:
PASS(k/k faces have SPEC_G) or FAIL: n faces missing photon spectrum at
r = .... Verified red on a synthetic directory with the SPEC_G line
removed (FAIL: 1 face at r = 4.235) and green intact. Group edges
(1e-3 to 12 MeV, 12 log groups) print with the data; the receiver takes
the mean energy per group itself. No change on the chain side, which
already scored SPEC_G at every segment's outer boundary.

## Correction to the scope section above: the exclusion stands, the reason does not

The section "Scope of the 4.5 decades/m mark" says heavy segments "will
show rates far above 4.5 decades/m". The only measurement on hand
contradicts it: the two reference points at 2.475 and 2.775 m bracket
the vessel-steel layer and give 2.59 decades/m - below 4.5, not far
above. This is physically reasonable: iron has a deep-penetration
window near 24 keV where its cross section collapses, so iron's
deep-penetration attenuation is much weaker than its removal cross
section suggests. Dense steel is not by itself a good deep shield,
which is why shields pair it with hydrogenous material. The intuition
"heavy means fast attenuation" does not hold in the deep-penetration
regime, and the chain is that regime.

Corrected wording: heavy-segment rates are outside the concrete band's
domain; they may be above or below 4.5 (vessel steel measured 2.59).
Those rows report numbers and are fitted to no band. A heavy segment
reporting 2.5 decades/m is normal, not suspicious.

Why it matters: a correct exclusion with a wrong reason is harder to
catch than a wrong action, because the action passes review while the
attached explanation gets reused as a criterion the next time.

Domain of the 1-6 band, which should have been written with it: ordinary
or borated concrete with about 1 wt% hydrogen and density about 2.3-2.4.
Other bio-shield materials (lead-, iron-, or barite-loaded) require a
fresh derivation.

## Discriminator columns implemented

Beside each concrete face's photon block the generator prints: primary
discriminator epithermal/fast = sum(g5..g12)/sum(g13..g17) +/- Poisson
(zero epithermal printed as "< 3/N_fast"); confirmation column
thermal/epithermal = sum(g0..g4)/sum(g5..g12) +/- Poisson (zero thermal
printed as "< 3/N_epithermal"); the three band counts with their group
edges printed from the data. Synthetic rendering: primary 0.212 +/-
0.070, confirmation < 0.273. Scope printed with it: weak-photon branch
only, concrete faces only. Format closed on both sides.

## Heavy-segment wording corrected in the generator; the 2.59 is computed, not typed

Non-concrete faces now print: "outside the concrete band's domain, may
be above or below 4.5 (vessel steel measured 2.59 decades/m, computed
from the two reference points); numbers only, no band". The 2.59 is
derived at generation time from ref_2.475.log and ref_2.775.log:
log10((174/300k)/(29/300k))/0.30 = 2.594. If the reference logs are
missing, no number is printed; there is no typed fallback.

Producer's own account, recorded: when it wrote "heavy segments are
naturally far above 4.5", the counts 174 and 29 were already in the
table it had delivered, and the steel layer's 2.59 was one division
away. An adjective that sounds like physical common sense, sitting next
to a number saying the opposite - the third instance today on its side.

## Chain progress (still before the deliverable)

Stage one completed 04:51:18Z (estimate 04:56Z). First-crossing
records at r = 2.355 m: 23,247 / 500,000, T0 = 4.65e-2. Ratio to the
multi-crossing profile 0.60 (first crossing is expected lower; killcut
small sample 154/3000 = 0.051 +/- 0.004, this value within 1.2 sigma).
Pipeline gate rung0 PASS; stage-one gate (>= EXP/4 = 9,723) passed.
Base ten segments at 400k launches each started; CHAIN-DONE still
estimated near 06:30Z, fault line 07:00Z unchanged.

## Pre-registered prediction of the concrete segment count (chain running, base segments not yet delivered)

Author sci-rad-01. From stage one: T0 = 4.65e-2 at r = 2.355 m (first
crossings). Target 2.2e-10 at the outermost concrete face, so 8.33
decades remain from 2.355 m. Correction that makes it stricter: T0
counts first crossings only, and the multi-crossing profile ratio is
0.60, so the full flux at that face is higher by 1/0.60 and the
requirement is 8.55 decades, not 8.33 (0.22 decades, 5.8 cm of concrete
at 3.8 decades/m; unfavourable, stated on the same line).

Inner heavy layer 2.355 to 4.235 m = 1.88 m (WC-B4C, vessel steel,
windings, cryostat); the only measured rate in it is vessel steel at
2.59 decades/m.

| heavy-layer rate (dec/m) | it contributes | left for concrete | at 3.8 dec/m | 0.5 m segments |
|---|---|---|---|---|
| 2.00 | 3.76 | 4.57 | 1.20 m | 3 |
| 2.59 (measured) | 4.87 | 3.46 | 0.91 m | 2 |
| 3.50 | 6.58 | 1.75 | 0.46 m | 1 |
| 5.00 | 9.40 | -1.07 | - | 0 |

Prediction: t most likely 0.5-1.5 m, i.e. 1-3 segments. The base run
of ten segments (5.0 m) should cross the target well before it is used
up; if it does not, that is itself a finding.

| observed | implies |
|---|---|
| target met at 0 segments | heavy-layer rate >= 5 dec/m, twice the measured steel; needs explanation |
| 1-3 segments | as predicted |
| 4-6 segments | concrete rate below 3.8; check the dry recipe (low end of band, pre-registered as explainable) |
| > 6 segments or 10 used without reaching target | suspect the chain first: 8.55 decades over 5 m needs an average below 1.7 dec/m, under the band's floor |

Use: when the chain reports a segment count, whether it is reasonable
is already written down. The prediction is not used to hurry the chain
or to pre-empt its result. Stage-one gates read and endorsed as
self-consistency checks, not correctness checks.

## The chain's stop condition is run control, not the criterion

sci-rad-01's D_ref(t) evaluator, self-tested on synthetic data with all
four branches reached, inverted the criterion and found the exact
escape required at r = 4.235 m is 2.080e-10, 5.5% below the 2.2e-10
the chain stops at (the difference is rounding in the earlier two-digit
division). The requirement then tightens with t because the emitting
surface moves toward the village:

| r m | t m | exact escape required |
|---|---|---|
| 4.235 | 0 | 2.080e-10 |
| 5.235 | 1.0 | 2.049e-10 |
| 6.235 | 2.0 | 2.019e-10 |
| 7.235 | 3.0 | 1.989e-10 |

At t = 3 m the chain stopping at 2.2e-10 stops 10.6% early.

Ruling: the stop condition is not changed. Making it a function of t
would push the dose model into the chain's run logic, the same
objection as to a fitted coefficient. Instead the arbiter changes:
the chain stopping at 2.2e-10 means "ran enough", not "passes".
Passing is decided by D_ref(t) at each face's real radius against the
0.0381 / 0.0752 lines, which is 5-11% stricter than 2.2e-10. A chain
that stops between 2.0e-10 and 2.2e-10 is a boundary case requiring one
more segment, not a pass.

Self-test branches reached: r = 2.775 heavy material, out of domain, no
band; r = 4.735 in band at 3.8, photon sealable ~26%; r = 5.235 in band
at 5.2 but >= 4.5, photon column divergent, scoring to be redone;
r = 6.235 escape 9e-11, D_ref 1.7e-2, passes. The third branch is the
straddle case as a reachable instance: neutron channel normal, photon
channel divergent, two channels giving different verdicts at one face.

On arrival the third report line is one evaluation: each face's
(r, escape, decades/m, concrete or not) fed to read_chain().

## Correction: the optional 2.0e-10 stop was wrong in direction

2.0e-10 does not cover t <= 3 m: exact requirements are 1.989e-10 at
3 m (short 0.56%), 1.959e-10 at 4 m, 1.929e-10 at 5 m. Covering 3 m
needs 1.98e-10; covering 5 m needs 1.95e-10. Rounding a stop condition
must go toward the tighter side; "nearest" is not a direction, and
2.0e-10 was the nearest round value on the loose side. The two clean
options stand - keep 2.2e-10 with D_ref(t) as arbiter, or tighten to
1.98e-10 / 1.95e-10 - and 2.0e-10 was the one option that imported the
external model without achieving coverage: a compromise carrying both
plans' defects. Withdrawn.

## Crossed messages: the producer adopted 2.0e-10 before the withdrawal arrived

Its delivery sentence claimed 2.0e-10 "covers all pass requirements for
t <= 3 m", which is false by 0.56% at 3 m. The extension driver was
still idle waiting for CHAIN-DONE, so a second re-hang is safe; it is
asked to set TARGET to 1.98e-10 (covers 3 m) or 1.95e-10 (covers 5 m,
recommended since the extension cap of 19 layers can exceed 3 m) and to
correct the sentence.

Operational lesson recorded from the producer: its first re-hang used a
bare pkill pattern that matched the ssh session's own command line and
killed it first; the driver died, the re-hang never ran, and the only
signal was ssh exit code 255. A watchdog's fourth failure mode: killed
by the action that manages it. Fix: anchor the pattern to the script's
own command line.

Chain step 1 (WC-B4C shield 0.12 m, LiPb 0.30 m inner zone):
400,000 launched / 5,149 out = 1.287e-2; face loss with buffer 0.0674
(0.53 without); cumulative T1 at r = 2.475 = 4.65e-2 x 1.287e-2 =
5.99e-4 against the single-pass reference 5.80e-4, ratio 1.03 (0.4
sigma at combined ~7.8%). Method gate, first point, passes as a
rehearsal; formal reading waits for analyse_chain2.py on both points.
Shield segment 15.8 decades/m - non-concrete, numbers only.

## Second correction on the same line: 1.95e-10 does not cover 5 m either

The requirement table gives 1.929e-10 at t = 5 m; 1.95e-10 is 1.1%
above it and covers only to about 4.3 m. The value originated in
sci-rad-01's message ("covering 5 m needs 1.95e-10") directly beneath
its own table showing 1.929e-10, and 总控 relayed it without checking
it against that table. The producer did not copy it: the extension
driver is re-hung with TARGET = 1.92e-10 (read back from
/proc/7616/environ; base chain PID 3797 unaffected, step 2 running),
and the delivery sentence now reads "cumulative T <= 1.92e-10 (covers
t <= 5 m per the receiver's table: 1.929e-10 at 5 m), run control, not
the criterion". Rounding toward the tight side, one extra layer costs
about ten minutes.

Recorded as an instance of "a correction carries the next unchecked
claim": the withdrawal of 2.0e-10 was right, and the replacement value
in the same message was wrong in the same direction.

## Narrowing within the registered prediction (not a replacement)

Step 1 reproduced: 2.355 to 2.475 m, 0.12 m WC-B4C, T0 4.65e-2 to T1
5.99e-4 = 1.890 decades over 0.12 m = 15.8 decades/m.

The registered prediction treated 2.355 to 4.235 m (1.88 m) as
attenuating material at ~2.59 decades/m. By the layer table at least
0.75 m of it is vacuum:

| layer | range m | thickness m | note |
|---|---|---|---|
| WC-B4C | 2.355-2.475 | 0.12 | measured 15.8 dec/m |
| vessel steel | 2.475-2.775 | 0.30 | measured 0.778 decades |
| VV-TF gap | 2.775-3.025 | 0.25 | 0.15 m of it vacuum |
| TF windings | 3.025-3.575 | 0.55 | metal, rate unknown |
| CryoGap | 3.575-4.175 | 0.60 | vacuum, zero attenuation |
| cryostat | 4.175-4.235 | 0.06 | steel |

So "heavy layer contributes 4.87 decades" was an overestimate, in the
unfavourable direction. Narrowed:

| TF+cryostat rate dec/m | T(4.235) | concrete needed | segments |
|---|---|---|---|
| 2.0 | 6.0e-6 | 4.48 decades = 1.18 m | 3 |
| 2.6 (vessel steel) | 2.6e-6 | 4.11 = 1.08 m | 3 |
| 4.0 | 3.6e-7 | 3.26 = 0.86 m | 2 |

2-3 segments (t = 1.0-1.5 m), inside the registered 1-3, toward the
upper end. The registered prediction of 1-3 segments is NOT replaced;
new data tightened the distribution inside it. If the result is 3
segments, that is the upper end of the original prediction hitting,
not an after-the-fact adjustment.

On "heavy segments": WC-B4C at 15.8 shows the producer's original
sentence true for that material; vessel steel at 2.59 shows it false
for the class. Both ends now have instances, which is why those rows
carry no band.

Domain hole added: decades/m is meaningful only over segments that
contain material. A segment spanning vacuum (CryoGap, 0.60 m) reports
~0 correctly and must not trigger "< 1, suspect the chain". The band's
domain now has two holes: non-concrete material, and no material.

## The 1.95e-10 traced: a hand-typed "round" value, not a rounding

Exact requirement at 5 m is 1.9291e-10. 1.95e-10 is neither the
nearest value (1.93) nor the rounding toward the tight side (1.92); it
was a hand-chosen number written into a print string, in the same
message that stated "rounding must go toward the constraint; nearest is
not a direction". 1.95e-10 covers t <= 4.30 m; 1.92e-10, which the
producer took from the table, covers t <= 5.31 m.

Process rule extended: no hand-typed number may appear in a print,
including a "rounded" value; rounding is done by code with the
direction fixed as a parameter.

Shares: sci-rad-01 wrote the value; 总控 relayed it without checking the
table in the same message; the producer took the table over the
conclusion. First time on this chain that a downstream party blocked an
error by declining to copy the upstream conclusion - possible only
because the table travelled with the conclusion. Send the conclusion
with its basis: qualifiers prevent misreading, the basis prevents
copying.

Note for the driver: 1.92e-10 covers t <= 5.3 m. The extension cap is
19 layers = 9.5 m; beyond 5.3 m the value loosens again and must be
re-derived, so that it does not become another quantity that stops on
a round number.

## Row types implemented: three print forms

| face's segment | printed |
|---|---|
| no material (vac 0.15 in the VV-TF gap; cryostat segment 0.60 m vacuum + 0.06 m steel) | "no-material segment: decades/m not applicable, no band, no direction" |
| heavy material (WC-B4C, vessel steel, windings) | "outside the concrete band's domain, may be above or below 4.5 (vessel steel measured 2.59 below, WC-B4C above; the former computed from the two reference points); numbers only, no band, no direction" |
| concrete | four-band verdict + <4.5 / >=4.5 photon representativeness mark |

Both non-concrete branches rendered on the synthetic directory. The
2.59 remains computed from the reference logs at generation time.

Producer's note: it briefly misjudged the previous wording change as a
silent failure by comparing against a file that had not been
re-rendered. Comparison must be made against the freshly generated
artefact - a relative of the console-versus-stored rule.

## Coverage cap written into the driver

Two lines, both in the log: at extension start, "TARGET 1.92e-10
covers t<=5.3 m (receiver requirement tightens with t); beyond,
re-derive - driver will stop and report, not adjust"; in the loop,
before each launch the driver computes t outside the next layer, and
if it exceeds 5.3 m while T is still above TARGET it logs
"ext STOP ... TARGET must be re-derived by receiver" and exits. It never
lowers TARGET itself; re-derivation belongs to the receiver.

Re-hang: PID 7616 -> 7786 (anchored kill pattern); /proc/7786/environ
reads TARGET=1.92e-10 and COVER_M=5.3; script hash fd30420b... matches
between repository and VM; base chain 3797 and step 2 unaffected.

## The receiver's own thresholds were hand-typed too; now derived in code

Applying the no-hand-typed-numbers rule to its evaluator, sci-rad-01
found both pass lines were typed roundings: conservative B/5.105 =
0.038099902 typed as 0.0381 (loose side, by 3e-7 relative);
permissive B/2.586 = 0.075212684 typed as 0.0752 (tight side).
Numerically irrelevant; directionally wrong on a threshold whose whole
meaning is its direction. Both are now computed with the rounding
direction fixed in a function (floor_to(B/ratio, 6) -> 0.038099 and
0.075212), which also means they follow automatically when the ratios
change - and they will change once a_dose collapses from the envelope
to one number.

While checking, it wrote "both fall on the tight side" into a print
that its own output contradicted: the sixth instance. Its conclusion:
the two earlier process rules ("read the output back" and "no
conclusion sentences in prints") were one rule not followed - it was
writing prose while computing. From here: prints emit computed values
only, with no judgement words; prose is written after the output is
read. All six instances occurred in the same stretch of work
immediately after a correct diagnosis. Executable form: after any
correction, treat the next piece of output as new and unchecked, not
as a continuation of what was just checked.

## Evidence status of this file, stated

Pre-registration has value only through a commit timestamp; an edit
has an mtime, which is neither fixed nor verifiable. The two sections
before this one were briefly uncommitted (Bash blocked in the
integrator session) and are now in df77da4; they are corrections to
recorded content, not predictions, so nothing needing a timestamp was
exposed. The items that need evidence status - the 1-3 segment
prediction and the reading rules - were committed while the chain had
produced nothing.

The same measure applied by sci-rad-01 to itself: its working
directory (E:\Claude\mars_rad - ten ledgers, two gates, 162 receipt
sections) is not a git repository. Its pre-registrations have evidence
status only because 总控 committed them into E:\Claude\mars. Rule: a
document's evidence status depends on whose repository it sits in, not
on what it says. Anything that must precede something else goes where
there is commit history; a pre-registration in an unversioned
directory is a carefully written memo. Going forward sci-rad-01 marks
content that needs a stamp as such when sending; the integrator commits
by its own judgement, and neither party commits on the other's behalf.

## Correction: the threat model was never stated, and the wrong one was used

Checked: E:\Claude\mars has no remote and never had one (consistent
with the standing no-push order); the commits above are authored by
the user, the same identity as any commit in mars_rad. So what this
repository gives a pre-registration is exactly two things - the
commit precedes the data, and another session read and accepted the
content - and neither is tamper-resistance or independent witness.

The evaluations above measured every timestamp against forgery,
rewriting, and self-signing. That is an adversarial threat model, and
this project has no adversary. What pre-registration guards here is
drift: fitting the explanation to the result after seeing it. Against
drift, a self-signed commit that precedes the data is sufficient,
because the failure it prevents is one the author would commit without
noticing, and the commit is what makes it noticeable.

Consequences: "self-signed is worth nothing to me" was true and
answered a question nobody asked; "mars has status, mars_rad has none"
overstated the same way. The real asymmetry was only ever that these
commits preceded the data and mars_rad's did not exist. From now on,
commits in mars_rad are sufficient for their purpose; what is sent here
for a stamp gains one thing more, acceptance by a second session, which
is worth having and is not evidence. Rule: before judging any
safeguard, name the failure it is meant to stop; a safeguard has no
strength except against a named failure, and measured against the
wrong one an adequate safeguard reads as worthless and gets replaced by
something more elaborate and no better.

## Chain progress: both method-gate points reached

| seg | material / thickness | out/launched | face loss | cumulative T | single-pass reference | chain/ref |
|---|---|---|---|---|---|---|
| 1 | WC-B4C 0.12 m | 1.287e-2 | 0.0674 | 5.99e-4 @ 2.475 | 5.80e-4 (174/300k) | 1.03 (0.4 sigma) |
| 2 | vessel steel 0.30 m | 1.618e-1 | 0.0029 | 9.69e-5 @ 2.775 | 9.67e-5 (29/300k) | 1.002 (ref sigma ~19%) |
| 3 | vacuum gap 0.15 m | 0.9994 | 0 | 9.68e-5 @ 2.925 | - | vacuum loses only the z ends, 0.06% |

Steel segment rate from the chain: log10(1/0.1618)/0.30 = 2.64
decades/m against 2.59 from the reference pair - the same physics by
two routes. Formal method-gate verdict is left to analyse_chain2.py on
both points together; as a rehearsal, segmentation with the inner zone
reproduces single-pass transmission at the depths the references
reach, so the chain's deeper results may be cited. Segment 4 (windings
0.65 m) running; then the cryostat segment to 4.235 m, then concrete.
CHAIN-DONE still estimated near 06:30Z.

## Method gate: formal verdict (analyse_chain2.py, both points)

| face r m | reference n/N | chain T_k | chain/ref | combined sigma | verdict |
|---|---|---|---|---|---|
| 2.475 | 5.8000e-04 (n=174) | 5.9849e-04 | 1.032 | 0.077 | OK |
| 2.775 | 9.6667e-05 (n=29) | 9.6827e-05 | 1.002 | 0.186 | OK |

METHOD GATE: PASS - segmentation with the inner zone agrees with
single-pass transmission at the depths the references reach (within
2 sigma). Two sentences travel with the verdict, from the script: it
excludes a visible bias from face truncation or resampling at these
depths; it does not exclude a new bias appearing deeper, where no
reference reaches, nor both being wrong in the same way. Deeper chain
results may be cited with those two sentences attached.

## Statistical warning, written before the chain completes

sci-rad-01's per-group criterion is the minimum record count along
the chain: each segment resamples the finite records of the one before,
so a group's independent information is capped by the thinnest segment
it passes through. On the real partial chain:

| group | energy MeV | chain minimum | at segment | >= 18 (10%)? | >= 69 (5%)? |
|---|---|---|---|---|---|
| 12 | 7.37e-3 - 2.75e-2 | 778 | - | yes | yes |
| 13-15 | 2.75e-2 - 1.43 | 1039-1576 | - | yes | yes |
| 16 | 1.43 - 5.35 | 47 | 1 | yes | no |
| 17 | 5.35 - 20 | 16 | 1 | no | no |

Cause: segment 1 (WC-B4C) emitted only 5,149 records, 16 of them in the
top group; every downstream segment resamples those 16 in g17, and more
launches downstream add no independent information. Per the
pre-registration this is statistical reading C for g17: report the
bound and the events required - x1.13 segment-1 records for 10%, x4.3
for 5%.

Disposition: the running chain is not interrupted (g17 does not decide
the first-line question and the 07:00Z line stands). After EXT-DONE a
second chain, chain2b, relaunches segment 1 at 5x (400k -> 2M, about
30 min) and reruns the segments after it (about 1.5 h); both versions
are delivered side by side, each with its own name and stamp. g16
rises above the 5% line as a by-product. Generator and analysis now
carry "minimum at segment" and "factor needed" columns so the segment
to fix is visible at a glance.

Correction by the producer: g16 does not rise as a by-product. Its
chain minimum of 47 sits at segment 2 (vessel-steel exit), not segment
1, so enlarging segment 1 does not lift it. chain2b launch counts are
set from the "minimum at segment" column, not from the intuition
"enlarge the source":

| segment | current launches | chain2b launches | purpose |
|---|---|---|---|
| 1 (WC-B4C) | 400k | 2,000k | g17: 16 -> ~80, past the 5% line of 69 |
| 2 (vessel steel) | 400k | 800k | g16: 47 -> ~94, past 69 |
| 3-10 | 400k | 400k | other groups already >= 69 |

Stage one (23,247 records) and both reference points are reused, not
rerun. chain2b starts automatically after EXT-DONE and is delivered
beside chain2 with its own name and stamp. Segment 1 at 5x takes about
30 min, segment 2 at 2x about 20 min. The column existed for exactly
this use; the intuition fired first and the table caught it.

## Deep-region validation, pre-registered before CHAIN-DONE (sci-rad-01, its commit 32a31a9 at 05:22Z)

What the method gate established, stated to its resolution: the
reference at 2.775 m has 29 counts (sigma 18.6%); the 174 -> 29 ratio
has sigma 20.1%; so "1.002" is agreement at the ~19% level, and the
proposition it supports is "no deviation larger than ~19% at these
depths". Four significant figures on a one-figure quantity is ~90x
over-precision, and such numbers are the kind that get cited onward
(2.64 vs 2.59 decades/m likewise: 2.9% apart on a comparison that
cannot resolve below 20%). Scope drawn correctly: the gate validates
segmentation and re-representation, not the physics - same cross
sections, geometry and code, two computations.

The structural limit, quantified: validated at 9.667e-5 per source
neutron (29 counts); the answer is needed at 2.2e-10; ratio 4.39e5.
Validation is strongest where it is least needed, and absent at the
depth the answer comes from. No single-pass reference can exist deep,
so this is not repaired by doing more of the same.

Three internal checks needing no external reference, each observed to
pass and to fail (sim/11_deep_region_validation.py):
1. Spectral equilibrium: past ~2-3 mean free paths in uniform material
   the exit spectrum shape should stop changing. Criterion without an
   invented threshold: the L1 distance between successive concrete
   faces must decrease monotonically with the last step smallest
   (monotonicity cannot be satisfied by picking a lenient number),
   plus an absolute floor L1 < 0.05, since "monotone but still large"
   is still drift. Drifting late segments mean the per-segment source
   re-representation has not converged, and no shallow gate rescues
   the deep number.
2. Join closure: the chain's cumulative T must equal the product of
   per-segment ratios within 1%. Computed by different parts of the
   pipeline; disagreement locates to a join - the one place
   segmentation can leak that has no single-pass counterpart.
3. Rate stability: once the spectrum is in equilibrium, decades/m in
   one material must be constant across segments (end-to-end +/-10%).
   A trend means re-representation drift even if each segment looks
   reasonable alone.

Withdrawal rule, written while every value is unknown to everyone:
check 1 NOT CONVERGED or check 2 JOINS LEAK => the deep escape
fraction is not citable, however far from 2.2e-10 and whichever
convenient side it falls on. Check 3 DRIFTING alone => downgraded to an
order-of-magnitude statement.

Also from sci-rad-01: its print gate had declared the hand-typed-number
half advisory in prose while still letting it fail the run - policy
written, not implemented, the very defect the file exists to treat.
Fixed: enforced half (judgement words) and advisory half (typed
numbers) separated in output and exit code; now 0 enforced / 9
advisory = GREEN.

## Producer's implementation of the three checks, and what check 2 can and cannot test

| check | printed | status |
|---|---|---|
| 1 spectral equilibrium | L1 sequence of successive concrete-face 18-group normalised spectra | table ready, fills as concrete faces arrive |
| 2 join closure | relative difference of the per-segment running product from two sources: A = face-source file records / launched, B = log escape_per_source_n (Geant4 internal count); three faces so far +0.00 / +0.00 / +5.0e-7 | printed |
| 3 rate stability | decades/m per concrete segment | table ready |

Check 2 as pre-registered ("cumulative T equals the product of segment
ratios") is a tautology in this pipeline, because T is defined as that
product; it has no power. The producer did not print a tautology. It
prints two independent sources, file versus log; a divergence means the
record path and the internal count disagree (the kind of fault seen
this morning when a stage file was not merged). It tests transcription
consistency, not physical closure. Physical closure on this chain
exists in one form only, the method gate against single-pass runs, and
that has no reference beyond 2.775 m. sci-rad-01 is to read check 2 as
file-log consistency, or name another observable it wants.

Method-gate ratios rewritten to their resolution: 2.475 m "1.03 +/-
0.08, consistent within ~8% (0.4 sigma)"; 2.775 m "1.00 +/- 0.19,
consistent within ~19% (0.0 sigma)"; a note under the table gives the
29 counts and no four-figure values appear. The three withdrawal rules
are copied into the delivery's qualifications section, labelled as the
receiver's pre-registration.

## Per-joint bias: invisible where measured, multiplied where used (sci-rad-01, before CHAIN-DONE)

The method gate validates after 2 joins at ~20% resolution; the answer
comes after ~10 joins. A +5% bias per join is 1.10x after 2 joins
(invisible to the gate) and 1.63x after 10; +10% is 1.21x and 2.59x.
This sits between the gate's two sentences: not "visible at these
depths" (it is not) and not "newly appearing deeper" (it was always
there). Declared blind spot: the receiver's own join-closure check
cannot see it - if every join loses the same fraction, both sides of
the comparison move together and it returns CLOSED, wrongly. Join
closure detects inconsistency between two internal computations, not a
bias they share.

Test that can see it, cheap (cut_count_test, in ledger 11, self-tested):
the same slab, same total thickness, cut into different numbers of
segments (2 cuts vs 4). No per-joint bias gives identical answers; a
bias b gives a difference of (1+b)^dn, from which b is solved as a
measured upper bound rather than a verdict. It must run on a shallow,
high-count slab, not a deep face: b = 5% shows as only 10.3% at dn = 2,
below the ~20% count noise of a deep face. One extra short run on an
existing slab suffices. Forwarded to the producer for feasibility and
timing; not to interrupt the running chain.

## Two rulers in one sentence: the count thresholds need a definition

The receiver's ">= 18" is the group's own relative error 1/sqrt(N) =
23.6%. The producer's "10%" <-> N = 18 and "5%" <-> N = 69 satisfy
error = 0.424/sqrt(N) exactly - a different ruler, apparently a
weighted contribution to some total. Consequence for chain2b sizing:
on the producer's ruler g17 -> 80 and g16 -> 94 both clear the 5% line;
on the receiver's ruler they are 11.2% and 10.3%, short of 10%; the
receiver's 5% would need x25 on g17 and x8.5 on g16. The producer is
asked what 0.424 is; the receiver records on the producer's ruler once
defined, not on a guess.

## Check 2 resolved: the receiver adopts the producer's file-versus-log reading, and records why its own check was empty

The receiver's self-test of join closure does fire (injected inputs
return JOINS LEAK), and that is exactly why it proved nothing: the two
sides were fed as independent inputs, and nothing in the real pipeline
can supply them independently. An injection test establishes
sensitivity, not applicability - it shows the check can fire on some
input and says nothing about whether the system producing the data is
able to make it fire. Three earlier impossible-to-fail checks in this
project were all caught by a control group; here the control group
passed and the check was still empty, which is strictly harder to see.

The question that should have been asked: "name a real event that
would make this check fire." If the answer needs two quantities the
pipeline derives from each other, it is a tautology and no control
group helps. Vacuity must be tested against the producer, not against
the checker. The receiver pre-registered check 2 without knowing how
the pipeline computes cumulative T.

The producer's A/B comparison (face-source file records versus Geant4
internal count) is not a lesser substitute; it is better, because it
has already caught a real fault on real data (the unmerged stage file
this morning). A check with one real catch ranks above a check with a
clean synthetic injection and no catch: injection proves the checker
works, a real catch proves the check points at something. The
withdrawal rule for check 2 changes meaning and is strengthened, not
weakened: a failure there means the number was transcribed wrongly and
is void outright, not that the physics is in doubt.

Per-joint bias remains the one observable with no substitute: join
closure and A/B both miss it. The cut-count test on segment 1 (WC-B4C,
5,149 exit records, 1 cut -> 3 cuts, dn = 2) resolves a per-joint bias
down to b > 1.95%, bounding the deep result over 10 joins to 1.21x; the
same test on the 29-count face at 2.775 m resolves only b > 23.5%,
i.e. 8.25x. The cheapest run gives the tightest bound because the
bound is set by counts, and counts are highest where shielding has not
yet happened. Request to the producer: one short rerun of segment 1,
same material and total thickness, cut into 3 segments instead of 1;
compare exit transmission, solve b, report the measured upper bound
and no verdict.

## Producer's answers: the 0.424 ruler was never its own, and the cut-count test is scheduled on concrete

0.424 is not a quantity the producer defined. The whole sentence
">= 18 for 10%, >= 69 for 5%" - thresholds and labels together - was
copied from an earlier line in sci-rad-01's ledger 7 ("each
dose-dominant group needs 18 effective counts for 10% precision"). The
producer never derived it or attached a definition; 0.10 x sqrt(18) =
0.424 is only the coefficient implied by that pair. So the "two
rulers" were both sci-rad-01's, one of them an older sentence of its
own relayed back to it. Disposition: the producer's table no longer
prints "meets 10% / 5%"; it prints the group's own relative error
1/sqrt(N_min) (the receiver's stated ruler) with 18 and 69 kept only in
a "receiver threshold" column. On the real partial chain: g17 25.0%,
g16 14.6%, g15 3.1%. chain2b re-sized on 1/sqrt(N): 10% <-> N = 100:
segment 1 400k -> 2.5M (g17 16 -> ~100), segment 2 400k -> 1.0M
(g16 47 -> ~118, 9.2%). 5% <-> N = 400 would need x25 and x8.5 (about
2.5 h) and is not run unless the receiver asks.

Cut-count test: feasible, designed, queued. Same slab, same total
thickness: from chain2's ss_5.txt (r = 4.235, t = 0), 1.0 m of borated
concrete cut as n = 1 (one 1.0 m segment, 0.06 m steel inner zone),
n = 2 (chain2's own segments 6-7, 2 x 0.5 m, already running), and
n = 4 (four 0.25 m segments, 0.25 m inner zone). 400k launches each;
exit counts at t = 1 m expected ~1e4, so at dn = 3 a 5% per-joint bias
shows as 15.8%, resolvable. This departs from the receiver's request
(segment 1, WC-B4C) by choosing the material the deep answer actually
passes through, with counts still sufficient. Runs automatically after
EXT-DONE, about 25 minutes; chain2b follows it - know whether the deep
number is citable before spending statistics on it. The producer
prints only T(n=1), T(n=2), T(n=4) and their pairwise ratios; solving
b and any verdict belong to the receiver. Neither run touches the
07:00Z line.

## Cut-count test, final design: both slabs, same batch, numbers only

| slab | source | cuts | sub-segments | inner zone (known confound) |
|---|---|---|---|---|
| seg1 WC-B4C 0.12 m (receiver's choice) | chain2 ss_0.txt, 23,247 records at 2.355 | 1 (= chain2 step 1, 5,149 out) vs 3 x 0.04 m | s3a/s3b/s3c | n=1: LiPb 0.30; n=3: LiPb 0.30 / shield 0.04 / shield 0.04 |
| concrete 1.0 m (producer's design) | chain2 ss_5.txt at 4.235 | 1 vs 2 (= steps 6-7) vs 4 x 0.25 m | n1 / n4a-d | steel 0.06 / concrete 0.30 / concrete 0.25 |

The producer accepted the receiver's reasoning - the bound is set by
counts, so the cheapest slab gives the tightest bound: 5,149 exits on
seg1 resolve b > ~2% at dn = 2, a ten-join bound of ~1.2x - and kept
the concrete slab because it is the material the deep answer passes
through and its counts suffice; the pair together tests whether one b
holds across materials. Printed: T(1), T(3) and T(3)/T(1) +/- Poisson;
T(1), T(2), T(4) and the three pairwise ratios. Solving b and any
verdict belong to the receiver. The inner-zone thickness differs with
the number of cuts; this is the test's known confound and is printed
with the data, not hidden. Waiter re-hung (PID 9549) after a failed
patch had left the old script in place; VM script verified to carry
the three s3 lines, hash 6db9f610... on both sides. Runs after
EXT-DONE, chain2b after it. 07:00Z unchanged.

## The ruler was the receiver's, and it was wrong; the 5% run has a decidable condition

1/sqrt(18) = 23.6%, not 10%; 1/sqrt(69) = 12.0%, not 5%. The labels
in sci-rad-01's ledger 7 were off by ~2.4x. The counts themselves
stand: 18 was always the starvation floor (the point where a Poisson
bound stops being vacuous) and holds as a floor; the "precision" label
was attached later and was never true. 10% needs N = 100, 5% needs
N = 400. Corrected at the source. The producer's disposition stands.

Two findings recorded with it. First, the receiver asked rather than
guessed; had it guessed it would have been reverse-engineering its
own reasoning, and about one's own past work one always has the most
material to build a plausible defence. "Ask, do not assume" protects
hardest exactly where the thing to be assumed is one's own. Second, a
wrong label acquired the appearance of independence by travelling a
loop: it left the receiver, was adopted by the producer as authority,
and came back labelled as the producer's ruler; the receiver then
spent a message distinguishing two rulers with one author, the second
of which did not exist. A number does not become independent by
passing through another party, but it becomes indistinguishable from
one that is. It was untangled only because the loop was short and both
parties were still talking; nothing structural caught it.

Rule for the 5% run (2.5 h): not "is g17 precise" but "does g17 carry
weight in the load-bearing quantity". For the epithermal/fast
discriminator, g15 alone has N ~ 1041 so N_fast > 1041 and g17 is
< 1.5% of fast; its 25% error adds < 0.38% to the ratio - negligible.
For a_dose the weight is dose, not counts, and g17 is the hardest
group with the largest h(E); its contribution to total-dose error is
w17 x 0.25, and keeping that below 1% of the total needs w17 < 4%.
Rule: if g17's dose share is < 4%, do not run; if >= 4%, run. The
existing spectrum decides it. The first report line never depends on
g17 and is not delayed for it.

Cut-count test: the producer's concrete slab is better on both axes -
N ~ 1e4 at dn = 3 resolves b > 0.93% (ten-join bound 1.10x) against
seg1's b > 1.95% (1.21x), and 8-10 of the ten joins are in concrete,
so a bias measured in tungsten carbide need not be the bias at
concrete joins. The receiver's reasoning optimised the statistics of
the measurement without asking whether the measured quantity
transfers - this project's own rule that the bound's surface must
match the criterion's surface, failing on its author. Both slabs run
as designed; order (cut-count first, then chain2b) endorsed.

## g17 share: the producer supplies count shares; the dose share needs the receiver's h(E)

| face r m | exit records | g17 counts | f17 (count share) | fast band g13-g17 share | f17 / fast |
|---|---|---|---|---|---|
| 2.475 | 5,149 | 16 | 0.0031 | 0.805 | 0.0039 |
| 2.775 | 64,714 | 19 | 0.0003 | 0.605 | 0.0005 |
| 2.925 | 399,767 | 112 | 0.0003 | 0.606 | 0.0005 |

w17 = f17 h17 / sum(f_g h_g) needs the receiver's h table; the
producer's ledger carries no h and does not compute it. If h17 is
within an order of magnitude of the fast-band mean, w17 is far below
4% on every face so far - that arithmetic is the receiver's, not the
producer's verdict. Concrete faces will be printed the same way as
they arrive. Each 18-group table in the delivery now carries a count-
share column with f17 and f17/fast printed beneath, and states in
words that w17 belongs to the receiver.

## Cut-count test: the confound is the size of the signal - asymmetry fixed before the numbers exist (sci-rad-01 fb66086)

T(n2)/T(n1) = (1+b)^dn x f, where f is the inner-zone difference
factor. Solving without removing f gives b + (f-1)/dn: a 4% inner-zone
effect at dn = 2 reads as b = 1.98%, and the test resolves b > 1.95%.
The confound is of the same order as the signal; it is not a footnote.
Unstated, a solved b would be cited onward as a joint bias.

Committed asymmetry, written before any value exists:
- ratio ~ 1 => both b and the inner-zone effect are small => the deep
  number is usable;
- ratio high => attributable to neither.
A confounded test keeps its full value in the "pass" direction and
none in the "fail" direction. Pre-registering this is the whole point:
once a high value lands, the confound becomes an explanation available
on demand for either side, and choosing it would feel like analysis.
Explicit commitment: a high ratio is not evidence of leaking joints.

The confound can be removed with one run: n = 3 again with a second
inner-zone thickness, cuts unchanged; the difference isolates f at
constant b. Without it, what is solved is a bound on (joint bias +
inner-zone effect) - a real bound, to be labelled by that name and
never cited as b. Timing is the producer's.

Two producer practices named as correct: printing the confound with
the data rather than after it (the same disclosure beside the number
is a limitation; after the number it is an excuse, with no word
changed), and verifying the re-hung script by hash on both sides -
two independent records of one artefact, the A/B principle applied to
code rather than counts.

## Deconfounding run added (producer): same cuts, second inner-zone thickness

| run | cuts | sub-segment inner zone | purpose |
|---|---|---|---|
| n=1 (chain2 step 1) | 1 | LiPb 0.30 | baseline |
| s3a/b/c | 3 | LiPb 0.30 / shield 0.04 / shield 0.04 | original |
| t3a/b/c | 3 | LiPb 0.30 / shield 0.08 / shield 0.08 | deconfound: cuts unchanged, inner zone changed |

The analysis prints three ratios, numbers only: T(3,0.04)/T(1) at
dn = 2, uncorrected, solving to "joint bias + inner-zone effect" and
labelled so, never cited as b; T(3,0.08)/T(1) at dn = 2; and
T(3,0.08)/T(3,0.04) at dn = 0, which isolates the inner-zone factor f
at constant b. The receiver's pre-commitment is printed verbatim as
the table header: ratio ~1 => both small, deep number usable;
deviation => attributable to neither, not evidence of leaking joints.

The concrete slab (n = 1/2/4) has no deconfounding run: its three
inner zones (steel 0.06 / concrete 0.30 / concrete 0.25) already
differ, so its solved quantity is labelled "joint bias + inner-zone
effect" likewise; a further n = 4 set with a 0.50 m inner zone (about
25 minutes) is available on request. Waiter re-hung, PID 9881; VM
script verified with three s3 lines and three t3 lines, hash
3f311372... on both sides. 07:00Z unchanged.

## The 5% run is not run; the producer's heuristic fell on the wrong side of its own threshold at the shallowest face

Receiver's h table (ledger 7, H*(10) neutrons, pSv cm2): h at the
fast-band floor 27.5 keV = 35.0, h(1 MeV) = 410, h(14 MeV, g17) = 505,
so h17 / h_fast_min = 14.43. The producer's heuristic required h17
within an order of magnitude of the fast-band mean; pushing r = 2.475
to 4% needs a factor of 10.3, and the table gives 14.43. The heuristic
was right on the deeper faces and wrong on the shallowest; the
producer's own label "the receiver's arithmetic, not my verdict" is
what saved it.

Absolute worst-case bound from f17 and the fast share alone (all
non-g17 fast neutrons at the band floor h = 35, everything else at
thermal h = 10.6, which cannot be lower): w17 <= 4.94% at 2.475
(ambiguous), <= 0.59% at 2.775 and 2.925 (decided: below 4%). The
ambiguity at 2.475 is bound slack, not physics: the worst case needs
80.5% of the fast flux crowded at 27.5 keV while 14 MeV flux is
present from a DT source; with the fast band averaged at 1.5 MeV the
actual value is w17 ~ 0.46%, an order of magnitude lower.

Decisive: the only ambiguous face is the one that does not feed the
result. r = 2.475 is the exit of the first WC-B4C layer, nearest the
DT source, where f17 is highest by construction; the device a_dose
reads the outer faces, and from 2.775 outward even the worst-case
bound is under 4%. Not run. The first report line never depended on
g17. Concrete faces are re-judged by the same rule as they arrive
(run only if w17 >= 4%); with their f_g columns the loose bound is not
even needed.

Two limits stated on the same line: the H*(10) table is "background
knowledge reproduced", not a cited source, and every percentage above
inherits that; and no bound from f17 and f_fast alone decides
r = 2.475 - 4.94% is genuinely undecidable there. "Cannot compute it"
and "need not compute it" are different sentences; the receiver
reports the second and does not hide the first.

## The concrete deconfounding run is requested: the point is the name, not the precision

The inner-zone factor f is "the buffer effect in a given material" -
how much re-simulated material the angular distribution and spectrum
must cross before re-equilibrating - and does not transfer across
materials. The deconfounded slab (seg1, WC-B4C) is exactly the one
that does not feed the result; 8-10 of the ~10 joins are in concrete.
Third appearance of one shape, this time on the producer's side: the
receiver had optimised measurement statistics without asking whether
the quantity transfers; the producer deconfounded the slab the
receiver had asked for rather than the material it had itself argued
was the right one. Improvement happens where it is easiest to make,
and in both cases the improving party had already stated the
principle that excludes it. Knowing a rule is not the same as having
it at the point of action.

Without the run, the concrete inversion is a bound on (joint bias +
inner-zone effect): real, not the one needed, never citable as b. With
n = 4 at 0.25 m versus n = 4 at 0.50 m (dn = 0) the concrete f is
isolated, giving b in concrete, and the ten-join bound is finally
about b. Condition: the first report line is not delayed; if the
schedule conflicts with EXT-DONE or CHAIN-DONE, the first line wins
and this run waits.

Question put to the producer before any inversion, asked rather than
assumed: the concrete inner zones were reported as steel 0.06 /
concrete 0.30 / concrete 0.25. If that maps n = 1 -> steel and
n = 2, 4 -> concrete, then n = 1 differs in material, not thickness.
A thickness confound can be divided out; a material confound cannot.
In that case n = 1 leaves the inversion entirely and the only usable
pair is n = 2 versus n = 4 (dn = 2, 0.30 versus 0.25 m). Mapping to be
confirmed.

## Schedule revised from measured segment times; the 07:00Z line made decidable before it arrives

Measured (VM clock 05:38:51Z): stage one 34.6 min; segment 1 WC-B4C
5.8 min; segment 2 vessel steel 11.0 min; segment 3 vacuum 10 s;
segment 4 windings 0.65 m at 20.6 min and still running at full CPU.
Segment 5 (vacuum + cryostat steel) about 3 min; five concrete
segments estimated 10-12 min each. CHAIN-DONE now expected
06:45-07:00Z, on the fault line. The earlier ~06:30Z estimate used the
reference run's per-history cost; heavy segments cost more; the
producer marks the earlier estimate as wrong and replaces it.

Reading of the 07:00Z line, fixed before it arrives (line unchanged,
verdict rule added): no CHAIN-DONE but the latest progress stamp is
<= 15 min old and the stage process is at full CPU => slow, not fault;
the producer reports a new ETA with the segment number. No CHAIN-DONE
and > 15 min without a new stamp => fault, handled as originally
agreed. The 15 min comes from the longest measured segment. The
watcher prints the last four stamps and the process state at the
line.

Integrator's addition against threshold drift: the threshold may rise
only from the measured duration of a completed segment, never from
the segment currently running; and any segment exceeding twice the
longest completed segment is reported as an anomaly even with fresh
stamps - not judged a fault, but not absorbed into the threshold
either, pending the producer's explanation.

## Mapping confirmed from the script; concrete deconfound run added; segment 4 reported as anomaly under the new rule

Mapping (read from the script, not guessed): every variant's first
sub-segment sees the same 0.06 m cryostat steel, because that is the
only material inside r = 4.235 m. The variants differ only in the
inner-zone thickness at later joins - n = 2: concrete 0.30 x 1;
n = 4 at 0.25: concrete 0.25 x 3; n = 4 at 0.50 (added, m4a-d, four
segments, about 40 min): concrete 0.50 x 3. So there is no material
confound and n = 1 stays in the inversion. Usable pairs: n=2/n=1 (one
concrete join), n=4/n=1 (three), n=4@0.25/n=2 (dn = 2, 0.25 vs 0.30),
and n=4@0.50/n=4@0.25 (dn = 0, isolating the concrete f). The earlier
line "steel 0.06 / concrete 0.30 / 0.25" listed one zone per variant
and read as "n = 1 is steel"; the producer owns the ambiguity. The
m4 set runs after EXT-DONE and delays only chain2b, not the first
line.

Segment 4 anomaly (not fault): longest completed segment is segment 2
at 11.0 min; segment 4 (windings 0.65 m, rho 8.4 Cu/steel, plus 0.30 m
steel inner zone) had run 20.6 min at 05:38Z at full CPU and will
exceed 2 x 11 = 22 min. Explanation offered: per-history cost scales
with dense-metal thickness crossed, 0.95 m against 0.30 m, about 3x,
predicting 30-35 min and completion near 05:50-05:55Z. Integrator's
ruling: the explanation carries a prediction and is therefore
decidable. If segment 4 completes within 35 min, its duration enters
the threshold as a completed segment; if it exceeds 35 min, that is a
second anomaly needing a new explanation, and this one may not be
reused. The watcher prints the threshold from completed segments only
and ANOMALY for a running segment past 2x.

## The fault line and its reading, revised on three points (sci-rad-01 9a3a753; adopted)

1. The line itself had lost its power. Remaining budget at 05:40Z
   (windings remainder + cryostat + five concrete segments at 10-12
   min) is 65-82 min, i.e. completion 06:45-07:02Z. 07:00Z was set
   when the ETA was 06:30Z with 30 min of margin; the margin is now
   -3 to +14 min. A deadline the job's own budget predicts it will
   cross is no longer a fault detector: crossing it carries no
   information, the reading would correctly return "slow", and a real
   fault would return "slow" too. New line: budget ceiling + 15 min
   = 07:18Z, stated explicitly. Fault detection belongs to the
   per-segment anomaly rule, which is what it was for.
2. The anti-drift rule was loosened by an atypical completed item.
   Twice the longest completed "segment" is 69 min if stage one
   (34.6 min, a build step) counts, too loose; 22 min if only
   transport segments count, which would accuse the windings. Twice
   the worst completed rate (WC-B4C at 48.3 min/m -> 96.6 min/m) is
   right: the windings run at 31.7 min/m, below WC-B4C's 48.3 and
   vessel steel's 36.7 - thick, not stuck. Thresholds normalise by
   work, not by segment count; stage one, not a transport segment,
   is excluded from the baseline. The integrator's "2x longest
   completed segment" is withdrawn, and with it the 35-minute close
   on segment 4, which is in band by rate. A single atypical
   completed item would otherwise loosen a max-based bar for
   everything after it: the anti-drift rule guarded the running side
   and left the completed side open.
3. "Stamp <= 15 min old and process at full load" does not separate
   slow from hung: a spin loop satisfies both. A heartbeat proves
   alive; only advancing work proves working. Two states sharing one
   observation - the STARTED-marker family, third appearance, and
   the one rule in this file that has never yet failed. Stamps must
   carry a strictly increasing work count (histories completed or
   events scored). At 07:18Z: work count advanced within the last
   15 min => slow; not advanced => fault.

## Cut-count batch, final composition

cut_count_test.sh: n1 (1 x 1.0 m concrete), n4a-d (4 x 0.25, inner
zone 0.25), m4a-d (4 x 0.25, inner zone 0.50), s3a-c (WC-B4C, 3 cuts,
inner zone 0.04), t3a-c (same, inner zone 0.08); n = 2 taken from
chain2 steps 6-7. Waiter PID 10264; VM script checked line by line
(n1=1, n4=4, m4=4, s3=3, t3=3), hash 5a1fdb23... on both sides, sync
12/12. Analysis prints numbers only, on the confirmed mapping:

| ratio | dn | meaning |
|---|---|---|
| T(2)/T(1) | 1 | one concrete join (inner zone 0.30); first sub-segment steel 0.06 in both |
| T(4@0.25)/T(1) | 3 | three concrete joins |
| T(4@0.25)/T(2) | 2 | 0.25 vs 0.30 confound not removed; labelled as such |
| T(4@0.50)/T(4@0.25) | 0 | isolates the concrete f at constant b |
| T(4@0.50)/T(1) | 3 | second inner-zone thickness |

The receiver's pre-commitment prints verbatim as the header. Order
unchanged: EXT-DONE -> cut-count test (about +40 min for the m4 set)
-> chain2b; the first report line is unaffected. The producer's note
that the watcher had been switched to the earlier "2x longest
completed segment" patch crossed with the revision above; it is asked
to switch to the 07:18Z line, min/m thresholds and work-count stamps
and report the new PID and hash.

## Two numbers in the anomaly report that do not hold (sci-rad-01 3eb9754)

1. A load-bearing dimension changed between messages: "windings
   0.65 m, 20.6 min" (31.7 min/m) became "segment 4, 0.95 m dense
   metal" (21.7 min/m). The conclusion "thick, not stuck" holds under
   both and more so under 0.95, but the per-metre exoneration already
   relayed was computed on 0.65. The integrator's reading, put to the
   producer as a question: 0.95 = 0.65 m windings + 0.30 m steel
   re-representation zone, i.e. segment thickness and simulated
   thickness per history are two denominators. If confirmed, cost
   thresholds normalise by simulated thickness including the inner
   zone (that is what CPU is spent on): WC-B4C 0.42 m -> 13.8 min/m,
   vessel steel 0.60 m -> 18.3, windings 0.95 m -> 21.7 at 20.6 min;
   attenuation rates stay per segment thickness; both denominators
   named. The later number is not automatically the corrected one.
2. The "~3x" mechanism does not predict the number it was offered to
   explain. On the producer's own rates, 0.95 m at vessel steel's
   36.7 min/m is 34.9 min - the predicted 35 min is exactly "the same
   per-metre cost as steel", which under a per-metre bar is not
   anomalous at all; a genuine 3x would predict ~105 min. The
   explanation was constructed for an anomaly the correct threshold
   would never have raised: the exception was doing the threshold's
   job. Ruling: under the per-metre bar the windings need no
   exception; the 35-minute prediction is kept as a test of the "~3x"
   claim only, decoupled from whether the segment is anomalous - near
   35 min means the claim fails and cost is of steel's order, near
   105 means it holds. The ruling structure (explanation + numeric
   prediction + pre-committed consequence) stands; the content failed
   it, and it was checkable only because it was said aloud.

The mapping guess was wrong and the receiver records the cost of
asking as one round and the benefit as not having discarded a usable
data point: "ask, do not assume" paid off in the direction where
nothing dramatic happened, which is where it most often pays and is
least noticed.

## Watcher as implemented, and the limit of its proxy

Line 07:18Z adopted with the reason recorded. Thresholds per min/m:
the watcher computes each completed transport segment's rate from the
progress stamps (stage one excluded as a build step; vacuum segments
at ~0 cannot become the "worst"); threshold = 2x the worst; running
segment rate = elapsed / material thickness (cryostat segment counts
its 0.06 m steel, vacuum not counted). Baseline: WC-B4C 48.3 min/m,
threshold 96.6; windings at 25 min were 38 min/m, in band - thick,
not stuck; the 35-minute close is void on both sides.

Work count: the running stage binary emits no per-event progress
(printProgress not enabled; the log jumps from the initialisation
banner to the RESULT block), so the only monotone quantity visible
inside a segment is the process's consumed CPU time. That separates
blocked/sleeping from computing-or-spinning; it cannot separate
computing from spinning. The watcher prints it as a proxy, labelled
so; the true increasing work count is the per-segment record count
written at each segment's exit. A periodic RESULT progress line goes
into stage.cc at the next compile, not mid-run.

Verdict wording therefore narrowed to the proxy's power: no CPU growth
in the last 15 min => FAULT holds; CPU growth => not SLOW but ALIVE
(proxy; spinning not excluded). SLOW is established only when the
next segment's exit records appear. If at 07:18Z the current segment
has not yet exited, the watcher prints ALIVE and the next decidable
point: the time by which a new segment must have written, computed
from the running segment at 2x the worst completed rate; no write by
then => FAULT. Implementation: deadline_check.py on the VM, sampling
CPU time and pid at 07:03Z and judging at 07:18Z; printing each
segment's min/m, the threshold, the running segment's rate and CPU,
and the 15-minute CPU-time increment. Deploying; PID and hash to be
reported.

## A two-parameter cost model from the producer's own timings (sci-rad-01 aa73d3e, before segment 4 completes)

Fit on the two clean transport segments (WC-B4C 0.12 m / 5.8 min;
vessel steel 0.30 m / 11.0 min): t(min) = 2.33 + 28.9 x thickness(m),
a fixed per-segment overhead of 2.33 min and a marginal 28.9 min/m.
Limit stated first: two points, residual zero by construction - a
prediction, not a validated model; checkable exactly because it
predicts something not yet observed.

1. It reproduces the producer's number and rejects its reason:
   windings at 0.95 m -> 29.8 min (producer predicted 30-35); the
   "~3x dense metal" mechanism -> 105 min, which the producer did not
   predict. A linear cost with per-segment overhead needs no special
   mechanism to give 30-35; the offered mechanism gives three times
   that. A correct number carrying a wrong reason passes review
   because the number is what gets checked - third instance in this
   record.
2. It makes the 0.65/0.95 ambiguity observable without anyone
   answering: 0.65 m -> 21.1 min (already exceeded when reported at
   20.6 and later 25 min), 0.95 m -> 29.8 min. The completion time is
   the discriminator; the question needs to be waited out, not
   answered. Two states already produce different observations - the
   cheapest kind of check, usable far more often than it is noticed.
   Registered here before the segment lands.
3. The per-metre threshold inherits the overhead and is still loose:
   48.3 min/m was measured on the 0.12 m segment, of which
   2.33/0.12 = 19.4 min/m is overhead, not work. Threshold on the
   marginal rate: 2 x 28.9 = 57.8 min/m plus overhead, giving 57 min
   for the windings rather than 92. Normalising by work is right;
   normalising by a mis-measured work rate is still loose, and the
   rate measured on the shortest segment is the most overhead-
   contaminated option available - and the one that set the bar.
4. Budget on the same model from 05:40Z: windings remainder 9.2 +
   cryostat 11.0 + concrete 5 x 8.1 = 61 min -> 06:41Z; the
   producer's 10-12 min per concrete segment sits above the model's
   8.1. If the model holds, CHAIN-DONE lands before 07:00Z. The
   07:18Z line still stands: the line is set against the worst case,
   not the estimate, and the two are not merged.

## Producer correction: the vessel-steel time was 21.0 min, not 11.0 - a remembered stamp, not a file stamp

From the progress stamps: 05:18:07 - 04:57:08 = 21.0 min. The 11.0
came from a 05:07 stamp that exists in memory and not in the file.
Corrected rates: WC-B4C 0.12 m / 5.8 min = 48.6 min/m; vessel steel
0.30 m / 21.0 min = 69.9 min/m, now the worst completed; windings
0.65 m at 27.1 min (05:45Z) = 41.7 min/m, in band. Threshold = 2 x
69.9 = 139.9 min/m, not 96.6. Conclusion on the windings unchanged;
the baseline is changed. deadline_check.py computes rates from the
stamps and uses no hand-typed number; its dry run printed exactly
48.6 / 69.9 / 139.9 - the reason it must be computed by script and
not dictated, and the dictated value was the wrong one.

Consequence for the two-parameter model above: one of its two points
is withdrawn. Refit on (0.12, 5.8) and (0.30, 21.0) gives a slope of
about 84 min/m and a negative intercept - a linear-with-overhead
model does not hold on these two points, or the overhead assumption
is wrong. The receiver is asked to refit or change the model form and
to recompute the 0.65/0.95 completion-time discriminator and the
06:41Z budget. The 07:18Z line is unaffected. Recorded: a hand-typed
timestamp, never checked against the file, entered three parties'
baselines and a model before it was caught.

Watcher status: deployed for 07:18Z per the three rules (sample CPU
time and pid at 07:03Z, judge at 07:18Z); dry runs pass in both
modes.

## The two-parameter model withdrawn by its author on a second ground: its independent variable was never identified (sci-rad-01 41e51fa)

Independently of the corrected stamp, the fit used segment thickness
as x, while the producer had stated seg1 carries a 0.30 m LiPb inner
zone - so WC-B4C's simulated thickness may be 0.42 m, not 0.12. Three
cases: fit on segment thickness (as reported), t = 2.33 + 28.9x,
windings 0.95 -> 29.8 min; both segments +0.30 m, t = -6.33 + 28.9x,
windings -> 21.1 min; WC-B4C +0.30 and vessel steel +0.12,
unidentifiable - both points at the same x. The third case is not
far-fetched and makes the fit meaningless. The author had declared
the "two points, zero residual" limit and missed that the two points
might not differ in x at all. Everything downstream is withdrawn with
it: the 06:41Z budget, the 57.8 min/m marginal threshold, and the
claim that completion time separates 0.65 from 0.95 - that
observation discriminates only when the cost model is identified,
and it is not.

Shape named on its third appearance in this exchange: min/m (minutes
measured, metres assumed); counts versus weighted contribution
(counts measured, weights assumed); validated depth versus answer
depth (ratio measured, correlation assumed). A rate is a ratio, and
the ambiguity lives in the denominator, because the numerator is the
half that was measured and reported and the denominator is inherited
from whatever the previous sentence happened to be about.

What identifies the fit: one line of data the producer already has -
each completed segment's simulated thickness (segment thickness +
inner zone). With it the fit is either identified or provably
degenerate; both answers are usable. Asked, not guessed, and this
time the thing to be guessed is the author's own model, the most
dangerous place to guess. The two-denominator rule (cost per
simulated thickness, attenuation per segment thickness, each named
where used) is adopted as load-bearing, not formatting: its absence
is what broke the fit.

## Producer confirms the denominators; the fit is provably degenerate

0.65 m is the windings' segment thickness (new material); 0.95 m is
segment thickness plus the 0.30 m steel re-representation zone, the
material actually simulated per history. Cost per metre normalises
by simulated thickness; attenuation by segment thickness; both named
where used. The watcher prints "segment / simulated / min / min per m
(simulated)" per segment and reads each zone from the segment log's
"RESULT buf =" line, not from the driver table.

Correction on the way: segment 2's zone is shield 0.12 m
(bufmat=shield bufthick=0.12), not steel 0.30, so its simulated
thickness is 0.42 m, not 0.60.

| segment | segment m | simulated m | time (stamps) | min/m simulated |
|---|---|---|---|---|
| 1 WC-B4C (+LiPb 0.30) | 0.12 | 0.42 | 5.8 | 13.8 |
| 2 vessel steel (+shield 0.12) | 0.30 | 0.42 | 21.0 | 50.0 |

The two clean segments have the same simulated thickness and differ
in time by 3.6x: t = a + b x thickness is unidentifiable from these
points - two ordinates at one abscissa. The variable is material, not
thickness (iron's multiple elastic scattering costs far more steps
per history than LiPb or WC). The 35, 105, 57.8 and 06:41Z figures
fall with the 11.0; the "~3x dense metal" reason falls with them.
Cost does not scale linearly with dense-metal thickness - both sides
were wrong about that.

Windings completion time stays a discriminator in the weak sense
only: the watcher prints its simulated rate against the threshold
(2 x worst completed simulated rate = 2 x 50.0 = 100 min/m). Verdict
wording implemented to the proxy's power: CPU growth prints ALIVE
(proxy; spinning not excluded), never SLOW; with no exit written for
the current segment, the next decidable point X = the segment's
completion ceiling at 2x the worst rate; no new segment written by
X => FAULT. PID and hash to follow with deployment. 07:18Z unchanged.

## Not refitted: the model section is withdrawn whole, not repaired (sci-rad-01 16a7385)

The integrator asked for a refit. Refitting was the wrong response.
Linear on the corrected points gives t = -4.33 + 84.4x with a negative
intercept; a power law t = 113.9 x^1.404 fits as well. Both are
two-parameter models on two points: zero degrees of freedom, exact by
construction, indistinguishable from each other. The linear form could
be rejected only because its intercept is unphysical, and that is the
entire discriminating power two points carry - not enough to issue
another prediction. The denominator ambiguity remains unresolved
regardless. A model destroyed by one data change and rebuildable by
the next was never a model; two points fit whatever form they are
handed.

What was actually needed is a comparison, and it did not move:
WC-B4C 48.3 min/m, vessel steel 70.0 (corrected), windings 41.7 at
05:45Z - below every completed segment. With the wrong number (11.0)
the windings were 31.7 against steel's 36.7, lower; with the right
number (21.0), 41.7 against 70.0, lower. The comparison gives the
same answer on wrong and right data; the model was destroyed by the
correction. Only the model was load-bearing downstream (the 0.65/0.95
completion discriminator, the 06:41Z budget, the 57.8 min/m marginal
threshold) - all withdrawn. "Thick, not stuck" stands unchanged.

The rule was already in the receiver's own record: a structural
argument survives changes of input, a numerical one does not. It
wrote that rule and then built the numerical argument after the
structural one had already delivered the conclusion. The model added
nothing the comparison had not given and added three claims that
could fail, all of which did. Ninth instance of a correction carrying
an unchecked claim, and the first in which the correction and the
claim were the same object: the fit was built to strengthen a
conclusion that needed no strengthening, and strengthening it is what
made it brittle.

No refit and no budget figure from the receiver: a budget needs a
model and there is no usable one. The first report line depends on
none of this. Threshold 2 x 69.9 = 139.9 min/m (segment basis) or
2 x 50.0 = 100 (simulated basis) accepted because it is computed by
script from stamps - which matters more than the value.

## The rebuttal of "~3x" is withdrawn too - it shared the wrong denominator with what it rebutted (sci-rad-01 f72442a)

The receiver had said the producer's 35 min was simply vessel steel's
per-metre rate, so no special mechanism was needed. That used 11.0
min / 0.30 m = 36.7 min/m; the correct figure is 21.0 min / 0.42 m
simulated = 50.0 min/m. Wrong time and wrong denominator: the
rebuttal's premise was false. The "~3x" mechanism is still wrong,
but what disposed of it was the producer's own replacement reason
(iron's multiple elastic scattering), not the receiver. A correct
conclusion on a false derivation is not a correct argument, and the
credit does not transfer with the conclusion. Tenth instance of a
correction carrying an unchecked claim, and the first where the
correction shared its defect with the thing corrected.

What was done right, named because it is reproducible: the three
degeneracy cases were written out as three concrete arrangements of
numbers, which is why one log read by another party could close
them. "This fit may have a problem" is unfalsifiable and stays;
"here is exactly how it may be degenerate" is what lets someone
settle it in one step.

Asked now rather than after: do the five concrete segments differ in
simulated thickness? If each is 0.5 m plus a 0.30 m inner zone, all
five sit at 0.80 m - the same degeneracy, five points at one x. That
yields run-to-run scatter, not a slope; worth having, since nothing
else in this chain measures repeatability, but it must be labelled
"repeatability measurement", never "cost law". The producer is asked
to print, per concrete segment and by script, either "same simulated
thickness => scatter is repeatability, no cost fit" or "differs =>
fittable". No fit before the concrete segments arrive, and then only
if their simulated thicknesses differ.

## Watcher deployed; dry run on real stamps at 05:45Z

deadline_check.py hash 8ef8f2727e731fcb, repository = VM, sync 13/13
with the file in the sync manifest. No resident process on the VM: the
script is invoked on schedule by the producer's local persistent
watcher (bxeanr60b), running "sample" remotely at 07:03Z (CPU time and
pid) and "final" at 07:18Z; the object to check for "watcher alive" is
that local process, and all four watchers were verified running.

Dry-run output (05:45Z, real stamps):
  completed transport segments (denominator = simulated thickness =
  segment + inner zone; attenuation separately per segment):
    step1 shield 0.12 m   seg 0.12  sim 0.42   5.8 min => 13.9 min/m
    step2 steel  0.30 m   seg 0.30  sim 0.42  21.0 min => 50.0 min/m
  threshold = 2x worst completed simulated rate = 99.9 min/m; the
  fixed-overhead term is not separable (equal simulated thickness)
  running segment wind: 29.6 min  seg 0.65  sim 0.95  rate 31.2 min/m
  CPU 99.9%
  DEADLINE-ALIVE: CPU growing (proxy; spinning not excluded); no exit
  written for this segment yet, SLOW not judged. Next decidable point:
  no new segment written by 06:53Z (this segment's ceiling at 2x the
  worst rate, 95 min) => FAULT.

The dry run prints the degeneracy itself ("fixed-overhead term not
separable") - visible in the output, not only in the discussion.
Inner-zone thicknesses read from each segment log's "RESULT buf ="
line. Windings at 33.6 min at 05:52Z, still computing.

## Necessity before feasibility: the fit is not needed, the scatter is (sci-rad-01 a3c22d0)

The receiver's question "do the five concrete segments differ in
simulated thickness" was a feasibility question that presupposed the
fit was wanted; the integrator's question "does any conclusion need
it" comes first, and the answer is no. The receiver notes it had
applied this rule twice to others' work today (boron acts on
amplitude not criterion; g17 precision matters only if g17 carries
weight) and not once to its own question.

One quantity is needed, and it is the scatter, not the slope. The
cut-count test's resolution assumes run-to-run variance is pure
Poisson, which nobody has checked:

| extra scatter | difference noise | b resolved to | ten-join bound |
|---|---|---|---|
| none (pure Poisson) | 1.41% | 0.93% | 1.10x |
| 0.5% | 1.58% | 1.04% | 1.11x |
| 1.0% | 2.00% | 1.32% | 1.14x |
| 2.0% | 3.16% | 2.07% | 1.23x |

Five concrete segments at one simulated thickness measure exactly
this scatter - an error-budget input the cut-count test already
assumes. A measurement justified by a named consumer is a different
thing from one justified by "we can get it anyway". The arrangement
flagged as a fit's degeneracy is precisely the arrangement the
repeatability measurement needs: same x, repeated; the runs change by
nothing, only what is read from them. Request, zero extra machine
time: print each concrete segment's minutes and simulated thickness
as already planned; the receiver computes the standard deviation
across the same-x points, reports the extra scatter, and updates the
cut-count b resolution and ten-join bound. If the five thicknesses do
differ, the scatter estimate weakens; the item is not void.

## Concrete simulated thicknesses, read from the driver: two x values, not one

From run_chain2.sh lines 101-105 and run_chain2_ext.sh line 96, not
memory: segment 6 (first concrete, at r 4.235) has segment 0.50 m plus
a 0.06 m steel zone (the cryostat wall), simulated 0.56 m; segments
7-10 and every extension segment have 0.50 m plus a 0.30 m concrete
zone, simulated 0.80 m. So: four or more points at 0.80 m - same
material, same simulated thickness, their scatter is repeatability
and is labelled so; one point at 0.56 m, which paired with the 0.80
cluster is the only same-material cost-slope information in the
chain, with the cluster's scatter as its error and a material
confound (steel zone versus concrete zone) that travels with the
number. Not "all five at one x" as written above.

Delivery and deadline_check.py print per segment both the segment
thickness (attenuation denominator) and the simulated thickness (cost
denominator, from the segment log's "RESULT buf =" line), cost per
metre on the latter; beside the concrete rows a script-judged line:
one distinct simulated thickness => "scatter is repeatability, no
cost fit"; more than one => "fittable, x = {...}, points per x =
{...}". No change to the run.

## A withdrawal in prose is not a withdrawal (sci-rad-01 bf7ab13)

Checking whether its evaluators can consume the incoming format, the
receiver found that check 2 had been withdrawn in the docstring
("WITHDRAWN AS WRITTEN, replaced by the A/B recording check") while
the tautological function check_join_closure(cumulative_T,
segment_ratios) remained untouched, still in the self-test, still
passing. The callable thing is the product. Second instance of the
same defect - check_prints had earlier declared its typed-number half
advisory in prose while the code kept failing on it - and that first
instance had been recorded as "the disease the file exists to
prevent". Recording a failure is not installing the guard against it.

Now implemented: check_recording_consistency(a_file_records,
b_log_escape), per face, two independent records, three states -
CONSISTENT (rel 0.00e+00, the faces reported at +0.00), RECORDING
PATHS DISAGREE (rel 1.93e-01 on the test), UNKNOWN (one side missing
or both zero). Failure means the number was transcribed wrongly and
is void, the harder failure as re-defined. All three branches
reached.

How it was found: not by a gate. By asking "can my evaluator consume
the format that is arriving" - the only question this session about
an interface rather than about content. Each of the four gates
compares a value against a statement about that value; none compares
a statement against the code that should implement it. That is a
blind spot shared by all four, and it has produced two defects. No
fifth gate is built for it yet: the reason to build a gate is that a
conclusion needs it, not that a blind spot was noticed. Recorded, to
be revisited when it produces a third defect or a conclusion rests on
it.

## Delivery column 4 implemented: segment and simulated thickness per segment

gen_source_term.py, same reading as deadline_check.py (inner zone from
each segment log's "RESULT buf =" line). Rows from current data:

| seg | material | segment m | inner zone | simulated m | min | min/m (simulated) |
|---|---|---|---|---|---|---|
| 1 | shield | 0.12 | lipb 0.30 | 0.42 | 5.8 | 13.9 |
| 2 | steel | 0.30 | shield 0.12 | 0.42 | 21.0 | 50.0 |
| 3 | vac | 0.15 | steel 0.30 | - | 0.2 | - (vacuum, no cost) |

Concrete rows carry a script-judged line: one distinct simulated
thickness => "repeatability: mean / range, no cost fit"; more than one
=> "fittable: x = {...}, points per x = {...}; inner-zone material
varies with x, a confound that travels with the number", with
repeatability printed separately for any x having >= 2 points. From
the driver it will print x = {0.56, 0.80}. Stated honestly by the
producer: the concrete branch first executes when segments 6-7 exist;
today only the syntax and the first three rows can be called correct,
not the branch.

Windings at 36.0 min at 05:54Z, full CPU, still computing: 37.9 min/m
simulated against a bar of 100, in band. Completion stamp to be
reported when it lands.

## Before the scatter is measured: the error budget takes its upper confidence bound, not the point estimate (sci-rad-01 589a0a0)

A scatter estimated from four points is itself uncertain, and the
direction is one-sided: underestimating the scatter makes the joint-
bias bound look better than it is.

| n | relative error of sigma | 95% upper bound / point estimate |
|---|---|---|
| 4 | 40.8% | 2.92 |
| 5 | 35.4% | 2.37 |
| 8 | 26.7% | 1.80 |

So what enters the cut-count error budget is the upper confidence
bound of the scatter - the project's "round toward the constraint"
applied to a variance rather than a threshold. Worked through for a
measured scatter of 1.0%: on the point estimate, b resolves to 1.32%
and the ten-join bound is 1.14x; on the n = 4 upper bound, b resolves
to 2.83% and the bound is 1.32x. The gap between those is entirely
the choice of which number to carry, and both would sound defensible.
The only honest moment to make that choice is while the scatter is
unknown to everyone. Chi-square quantiles are computed by series and
bisection, not looked up - the escaping-numbers rule applied at
writing time rather than caught afterwards.

What this does not do: four points are four points. The bound is wide
because the measurement is thin; using the upper bound is honesty
about that, not repair of it. If the cut-count result lands near the
boundary, the correct statement is "repeatability sample too small to
decide", not "the joints are fine".

Named as done right: the 0.56/0.80 pair is the only same-material
slope information in the chain and was not fitted, on the ground that
no conclusion needs it. That rule was applied where fitting would
have been tempting - an extra slope always looks good. A rule is
installed only when it is used against one's own advantage.

Standing: line 07:18Z; watcher hash 8ef8f272 on both sides, 13/13;
next decidable point 06:53Z, no new segment written => FAULT;
windings in band under 2 x 50.0 = 100 min/m simulated, no exception
needed; the dry run prints "fixed-overhead term not separable" - the
assumption withdrawn earlier now stated by the script, not by a
person.

## Concrete branch exercised on synthetic segments (staging directory; chain2/ untouched)

Synthetic segment logs (copies with the RESULT seg/buf lines and
progress stamps edited; test-named outputs, deleted after) produced:

| 6 | bcon | 0.50 | steel 0.06 | 0.56 | 12.0 | 21.4 |
| 7 | bcon | 0.50 | bcon 0.30 | 0.80 | 12.5 | 15.6 |
| 8 | bcon | 0.50 | bcon 0.30 | 0.80 | 11.5 | 14.4 |
script verdict: simulated thickness differs => fittable: x = {0.56,
0.80} m, points per x {0.56: 1, 0.80: 2}; inner-zone material varies
with x (see column), a confound travelling with the number.
  at x = 0.80 m, 2 segments as repeatability: mean 12.0 min, range
  1.0 min (8%).

What can now be said: the branch logic and format are correct. What
still cannot: the real concrete rows - the times and thicknesses
above are synthetic and mean nothing. Waits for segments 6-7. The
repeatability line will carry the upper confidence bound per the
section above once real points exist.

## Producer's intercept: wall-clock scatter is not transmission scatter

The assumption the cut-count error budget needs checked is that
run-to-run variance of the transmission T is pure Poisson. Column 4's
concrete rows scatter in minutes - the fluctuation of compute cost
per segment - and a segment running 0.5 min slow has no relation to
its T being 0.5% off. Column 4 stays as a cost table and its verdict
line gains "time scatter is cost repeatability, not T repeatability".
Second layer: the five concrete segments are not strict repeats even
in cost, since each segment's source spectrum differs (softer with
depth), so same-x time scatter carries a systematic term and is only
an upper bound on random scatter. The integrator relayed the wrong
quantity to the receiver; that share is the integrator's.

What does test the assumption: rerun one sub-segment (n4b, 0.25 m
concrete, same input source) with 2-3 different random seeds and
compare the scatter of T with 1/sqrt(N). About 3 x 8 min, not within
zero machine time; ruled approved at three seeds, queued after
chain2b so it does not contend for CPU, first report line unaffected;
the producer prints each T and 1/sqrt(N) only, the receiver computes
the ratio and the upper confidence bound (n = 3, wider still). The
receiver's scatter-to-b-resolution table is unchanged; only the input
source changes. A 06:53Z watcher is hung separately: no stamp from
segment 4 by then prints FAULT; a stamp prints the next segment's
decidable point.

## Seed repeats cannot run on the current binary; the Poisson assumption is carried as untested

From the source: stage.cc includes Randomize.hh and contains no
setTheSeed or seed= anywhere, so the Geant4 default engine starts
every process from the same fixed seed. The same input and command
run twice give bit-identical output. "Rerun with 2-3 seeds" therefore
needs a seed parameter in stage.cc and a recompile - not a zero-change
item; a new binary turns the sync check's "binary stale" line and
obliges the delivery to state two binaries' provenance.

Ruling: the seed parameter goes into the same compile as the periodic
RESULT progress line, after every current run (chain, cut-count,
chain2b) has finished; the three-seed repeat runs on the new binary,
with both binary hashes and their products labelled. Until then the
cut-count error budget carries "run-to-run variance is pure Poisson"
as an untested assumption; the b resolution and ten-join bound are
qualified by it, and no scatter upper bound is taken because there
is no scatter to bound. The receiver's upper-bound rule stands and
waits for its first input.

Corollary the producer recorded in the analysis script: in the
cut-count batch, n4a and m4a share an identical command (same source,
rcut, and 0.06 m steel zone), as do s3a and t3a; their exit files
will be bit-identical (sha256 to be printed when they exist, not
presumed) and cancel exactly in the dn = 0 ratios - cleaner
isolation; the ratio error formula counts that sub-segment's 1/N
twice and is conservative, left as is and annotated. On the current
binary no repeatability of any kind is measurable, so column 4's
verdict wording changes from "repeatability" to "same-x time scatter
(not independent runs; includes spectral drift)".

## End-to-end dry run of the three-line report: line 2 had nothing computing it (sci-rad-01 402fc5c)

Line 1 (resolved to 2.2e-10 or not) is a comparison; line 3 is
read_chain(); line 2, "collapse [0.344, 0.679] to one device a_dose
with the chain's 18-group spectrum", had no function behind it -
a_dose_of() answers a single incident energy. This would have been
found when the data arrived.

The weighting is not free: a_dose(E) is reflected dose per unit
incident dose, so the effective value is weighted by phi_g x h(E_g),
not by phi_g alone. Weighting by fluence would produce a different
quantity under the same name - the denominator error one level up,
looking entirely reasonable.

The self-test went red on first run, correctly: the "interior"
fixture's median energy sqrt(0.05 x 0.2) = 0.1 sits exactly on the
first grid point, and "e <= keys[0]" reported it as extrapolated - an
off-by-one at a boundary, inside the very flag whose job is to say
"do not trust this value". A value on a grid endpoint is exact, not
clamped. Fixed to strict comparison, fixture moved strictly inside;
the four cases now separate: soft-only 0.5509 with 0% clamped weight,
hard-only 0.3440 with 100%, mixed 0.4231 with 61.7%, all-zero None.
The clamped-weight share prints beside the number, not after it - it
is the figure that says whether the collapse can be trusted, and it
falls under the same rule as a confound.

Neither defect was caught by a gate. Both came from running the
whole report end to end on fabricated input before real input
existed. Gates check what was written down; a dry run checks what
happens. Four gates green, neither defect touched. Pre-delivery
questions now two: can the evaluator consume the incoming format, and
does the whole report run to completion. The second caught what the
first could not. All three report lines are now executable.

## Second consequence of the fixed seed, registered before chain2b exists

chain2b's segment 1 runs 2.5M histories and chain2's ran 400k, from
the same source file, the same fixed seed and the same event order:
chain2b's first 400k histories are bit-identical to chain2's, and
chain2b's segment-1 exit records are a superset of chain2's (all
5,149 should appear one for one in chain2b's ss_1). The two versions
diverge only from segment 2, where their inputs differ. The
side-by-side delivery must therefore say: segment 1 is superset and
subset, not an independent reproduction; the g17 gain from 16 to
~100 is 2.1M new histories added to the same sample, not a fresh
draw. Check: match the subset records one by one and print
matches/5149, not presumed. Filed by the producer in
NOTES_pending_disclosures.md alongside the bit-identical first
sub-segments of the dn = 0 pairs and the untested column-4 concrete
rows; written up as results arrive. No change to the run.

## Three rulings implemented in the generator (producer)

- Column 4 verdict: "repeatability" replaced by "same-x time scatter
  (not independent runs; includes spectral drift)"; where a simulated
  thickness has >= 2 segments, sigma point estimate and sigma 95%
  upper bound (n = ...) print side by side, chi-square quantiles by
  series and bisection; the line ends "no cost fit, not an input to
  the T error budget". Quantile self-check: upper/point = 2.92 / 2.37
  / 1.80 at n = 4 / 5 / 8, matching 589a0a0. Synthetic row (format
  only): at x = 0.80 m, 2 segments, sigma point 0.71 / sigma 95%
  upper 11.28 min (n = 2) - the bound is 15.9x the estimate, the
  sample too small to decide, which is exactly the required reading.
- Column 4 header and the cut-count ratio-table header both state:
  no seed entry in the current binary, so no repeatability of any
  kind is measurable; "run-to-run T variance is pure Poisson" is an
  untested assumption; b resolution and ten-join bound qualified by
  it; no scatter upper bound taken.
- Seed repeats deferred: seed= and the periodic RESULT progress line
  enter the same compile after chain, cut-count and chain2b finish;
  n4b x 3 on the new binary; delivery states both binary hashes and
  their products. On the producer's to-do list.

Gates 209 green. Windings still computing; 06:53Z and 07:18Z watchers
on station.

## Naming the consumer is not naming the measurement; a declared caveat that stays declared behaves as if closed (sci-rad-01 3a06743)

On the intercept: the receiver had named the consumer (the cut-count
error budget) and the arrangement (same x, repeated) and never named
the quantity - it wanted the scatter of T and asked for the scatter
of minutes. The rule "a measurement justified by a named consumer
differs from one justified by availability" is right and read as if
it also settled which quantity; it does not.

On the seed: "not yet measured" and "cannot be measured" are
different states, and only the first is resolved by waiting. The
receiver's own ledger 7 already carried a correlation_caveat: per-
segment relative errors cannot be combined as independent sums,
because record samples are shared across boundaries, and a total
error requires one independent end-to-end check at a single
thickness. The seed repeat is that check. The caveat was written and
then sqrt(2/N) was used throughout as if it had been answered. A
limitation that is declared and stays declared behaves exactly like
one that was closed, because nothing in the arithmetic remembers it.
All joint-bias bounds therefore become conditional statements: not
"b < x" but "b < x if run-to-run variance is pure Poisson". The
condition is not a hedge; the untested half is precisely the half
that would make the bound optimistic.

What determinism buys, in the opposite direction: identical-command
sub-segments cancel exactly in the dn = 0 pair, so f is isolated more
cleanly than assumed, and the producer's error formula, counting that
sub-segment's 1/N twice, is conservative - kept and annotated, not
tightened, the correct handling on discovering a conservative term.

The renaming of column 4 to "same-x time scatter (not independent
runs; includes spectral drift)" aligns the quantity's name with the
inference it can support. The receiver notes it did not find this
one itself; it was intercepted.

## Dry run one level deeper: the pipeline, a threshold never stated as a choice, and a second axis (sci-rad-01 dcd4873)

1. The collapse function existed and was self-tested on a synthetic
   grid handed to it directly; nothing loaded that grid from the
   matrix, so line 2 still could not run on real data. A dry run on
   synthetic input verifies the function, not the pipeline feeding
   it - "sensitivity is not applicability" one level up. Added:
   build_a_dose_grid() loading from the real files (18 E_in points
   per moisture; all 18 carry the known mass-fraction warning,
   counted not dropped).
2. Once loaded, it did not reproduce the published number, because
   "fast" has two definitions in the receiver's own ledgers:
   E_in >= 0.1 MeV gives the published 0.344-0.679; E_in >= 2.75e-2
   MeV (the g13 lower edge, the one the reading rules and the actual
   18-group spectrum use) gives 0.283-0.679. The 0.1 MeV threshold
   was never stated as a choice; it produced the published figure,
   the reading rules were later written to the group structure, and
   nothing tied the two together. A leakage spectrum with weight in
   0.0275-0.1 MeV - ordinary g13 territory - would collapse below the
   published lower limit and arrive looking "out of range" at the
   moment an explanation was most needed. Governing definition: any
   consumer of the chain's 18-group spectrum uses the group edge
   2.75e-2. Published range restated as 0.283-0.679. Direction on the
   same line: lower a_dose means less reflection, so this widens the
   range downward and weakens no conservative conclusion; 0.679
   drives every conservative conclusion and is unchanged.
   Consequence for the reading table above (integrator's arithmetic,
   marked for the receiver's recomputation): the permissive ratio
   scales to 2.586 x 0.283/0.344 = 2.13, so the permissive line moves
   from 0.0752 to about B/2.13 = 0.091 mSv/yr; the conservative line
   0.0381 is unchanged.
3. Line 2 cannot be delivered as promised. The promise was "collapse
   [0.344, 0.679] to one number with the chain's spectrum"; the grid
   has two axes:
   | h2o | fast a_dose |
   |---|---|
   | 0.00 | 0.419-0.679 |
   | 0.03 | 0.390-0.593 |
   | 0.08 | 0.329-0.515 |
   | 0.15 | 0.283-0.453 |
   The spectrum collapses the energy axis and does nothing to the
   moisture axis: about 0.26 of width is removable, about 0.23
   remains, and closing it needs an input nobody has named - the
   moisture of the village regolith. Line 2 will deliver a_dose per
   moisture, not one number. The promise was made before the matrix
   index had been looked at; saying so now costs a sentence, saying
   it on delivery day would read as an excuse.

Moisture basis: the integrator checked the village card, the
sentinel, well, thermal-infrared and radiometer cards, and every
receipt in dev/ - no unit has declared the village regolith's
moisture. Line 2 reports the four moistures side by side with "which
applies" marked as an undecided input; neither the receiver nor the
integrator picks. The village, holder of the site's soil card, is
asked for a sourced declaration, a process statement (regolith from X
treated by Y, moisture set by the process), or an explicit
"undecided"; regional water-ice data from the well or drilling
sessions would be regional, not site, and cannot substitute.

## Each report line printed together with the limits it stands on (sci-rad-01 dad569c)

The receiver scanned its own ledgers for declared-but-open limits: 72
declarations across 14 files. Listing them is not useful; what is
useful is which limits each report line stands on:

- Line 1: the 4.4e5 validation gap; what the method gate excludes and
  does not exclude; per-joint bias invisible at 2 joins and 2.6x at
  10.
- Line 2: two axes, the spectrum collapses only energy, moisture
  unnamed; "fast" from the g13 edge not 0.1 MeV; h(E) is background
  knowledge reproduced; every matrix file carries the 0.96
  mass-fraction warning.
- Line 3: S_n is copied and not verified here, and every dose is
  linear in it; h(E) as above; isotropic point source, no atmospheric
  attenuation, h at the 1 MeV maximum - all conservative choices of
  the receiver's own.

Design point: emit(line_no, text) prints the number and the limits it
stands on in the same call. A qualifier that lives elsewhere and must
be recalled when needed is exactly ledger 7's correlation_caveat,
which lived for weeks as if closed because nothing in the arithmetic
ever reached it. The only reliable qualifier is one printed by the
same call that prints the number; every other kind depends on someone
remembering it at the moment they are most absorbed in the result.
Lines with no registered limits print bare and visibly bare -
absence made visible rather than silent by default, the STARTED-
marker rule again.

What the scan cannot do, stated with it: it matches wording
("assumed", "caveat", "COPIED", "background knowledge"). A limit
never written in those words it cannot see; a limit never written
down at all nothing can see. It finds declared limits, not
undeclared ones - and the undeclared kind is exactly the moisture
gap, which no scan could find because nobody had written it
anywhere.

## Permissive line recomputed by the receiver: 0.0914 mSv/yr (sci-rad-01 c7aeed3)

Linearity checked, not assumed: ratio of ratios 1.9741 against ratio
of a_dose 1.9738, residual 2.5e-4. RATIO_PERMISSIVE at a_dose 0.283 =
2.1277; permissive line B/ratio = 0.091412; conservative line
0.038099 unchanged because A_DOSE_MAX did not move. Rounding
direction holds: a dose above the permissive target fails, so
rounding down makes failure easier to declare - the conservative
side; floor and nearest both give 0.091, the same answer by luck and
by rule, with the rule the one applied.

The finding underneath: this had been hand-computed each time a_dose
moved (0.11 -> 0.344 -> 0.283), the ratio re-derived by hand and
typed in - the very class this project has already failed on, a
value linear in a parameter restated manually whenever the parameter
changes. Now structured: A_DOSE_MAX, A_DOSE_MIN, K_RATIO =
RATIO_CONSERVATIVE / A_DOSE_MAX, RATIO_PERMISSIVE = K_RATIO x
A_DOSE_MIN; the next change propagates itself. Linearity is a claim
about this system and is cross-checked (LINEARITY_RESIDUAL against
the independently published permissive pair, 1.3e-4), not assumed.
The rule "a number linear in an undetermined parameter carries the
parameter on the same line" had been satisfied in prose and not in
code - prose once, callable once, the fourth time.

The integrator's figure was sent marked "my arithmetic, for your
recomputation" rather than published. The mark cost nothing because
the figure was right, and the difference between a number handed over
with "please check" and the same number handed over as a result shows
only when it is wrong, which is why it must be paid every time.

Moisture: no basis in the city, confirmed. Line 2 reports per
moisture; "which applies" is an undecided input; neither party picks.
Regional water-ice data is a number about another surface, not the
one the criterion lives on - the same distinction as everything else
in this file.

## The village answers: water content undetermined, stated, not estimated

The holder of the site soil card chose the third option and wrote it
into its card (in the working tree, to be committed on its delivery
notice): water content (mass fraction) = undetermined, no sourced
declaration, not estimated. Its reasons, recorded: no account in its
dossier - berm, thermal, or design accounts - declares the site
regolith's water content; the berm process declares only compaction
(rho = 1.65 is a density assumption, not a moisture one) and
"regolith cover"; the source is also unsourced - neither the card nor
DESIGN.md says which unit or depth the regolith comes from (mine
supply is a narrative inference, not a declaration); no drying or
dewatering step is declared. It added a read-back guard: the thermal
account's k = 0 style assumptions are not to be read as moisture
claims. Line 2 is settled: a_dose at the four moistures side by side,
"which applies" an undecided input, and the holder itself does not
estimate. This is the shape an undeclared input's answer should take:
say what is absent, and say which neighbouring numbers may not stand
in for it.

## "No error" is not "the expected value appeared" (sci-rad-01 ca85004)

The limits list had been hand-written text restating S_n, the a_dose
range and the fast threshold - prose that drifts from the code it
describes, the shape that has bitten this project four times. The
receiver changed the limits to read ledger 10's constants, checked
that it "passed", and wrote the commit message accordingly. It had
not passed: ledger 11 never imported os, _ledger10() raised on every
call, and every limit had run on the fallback branch from the moment
it was written. The check had grepped a 12-line window near the
self-test, saw no WARNING, and concluded the main path ran; the
WARNING was in the output, outside the window. "No error" is
satisfied by many failure modes; "the expected value appeared" is
satisfied by one. The first was checked, the second was reported.
Eleventh instance of a correction carrying an unchecked claim, and
this time the commit message itself asserted something false at the
moment of committing.

What worked was the part designed to fail loudly: the fallback
printed "a_dose constant unreadable - this line's limit cannot be
cited and must not be assumed", not stale text. The defect was
visible only because the failure branch refused to guess. Had the
fallback quietly kept the hand-written strings - the obvious and
tidier choice - the limits would have looked entirely correct and
been frozen forever at the constants as typed.

Now verified by appearance: the self-test prints all three lines and
asserts ledger 10's values occur in the text (fast at the g13 edge,
range 0.283-0.679; S_n = 2.271e20 with every dose linear in it;
thresholds derived not typed, 0.038099 and 0.091412; "constants
actually quoted, not restated: True"). A self-test that exercises
only the unregistered case cannot see whether the registered ones
are alive - "injection proves sensitivity, not applicability", this
time inside the receiver's own test rather than a gate.

## Synthetic output marked per line, not per block (sci-rad-01 c0422cc)

The village's answer shape is endorsed as the well-formed reply to an
undeclared input: state what is absent, and state which neighbouring
numbers may not stand in - the second half is the one usually
skipped, and it is the half that stops the gap being filled by the
wrong number next to it.

Applying that to itself, the receiver found its D_ref self-test
printing fabricated faces in the real report's format - invented
numbers, real-looking verdicts ("[FAILS] in band", "photons: deficit
DIVERGES, scoring must be redesigned") - into the same output stream
the real report will use, minutes apart. More urgent than the
village's case: the village's assumption sits in another document;
this sits in the same stream as the result.

The mark goes on the line, not on the block: "SYNTHETIC r=4.735
t=+0.500 esc=6.0e-06 -> D_ref 1.107e+03 mSv/yr [FAILS] ...". Block
headers scroll away; lines are what get copied. A warning that holds
only if the reader saw the previous paragraph fails exactly when the
output is long, which is when it is needed. The same treatment is
applied to the spectral, recording and rate self-tests in ledger 11,
and the limit placeholders change from neutral angle brackets, which
could be taken for formatting around a real value, to "SYNTHETIC
PLACEHOLDER - no chain result exists yet".

Receiver's open items: none. Line 2 settled (four moistures,
undecided); lines 1 and 3 unaffected; all three executable, limits
printed by the same call as the numbers, synthetic output marked per
line.

## One generator for the three lines; NOT-RESOLVED is the status of the whole report (sci-rad-01 1e08ca6 / 83cfe4b)

Asked again "does the whole thing run", the answer was no: the three
lines lived in two ledgers with nothing joining them, so at delivery
the receiver would have hand-assembled the resolution comparison, the
ledger-10 collapse and D_ref, and the ledger-11 limits at the moment
of highest pressure - the "line 2 had no callable" defect one level
up, found by the same question. sim/12_report.py now produces all
three lines, and its value is enforcement, not convenience: the
qualification rule was filed before any data existed - answer line 1
first; if not resolved, the mSv/yr is still computable, still looks
like a result, and would likely be quoted. A generator that prints
line 3 regardless would look compliant while violating the rule,
because the order would still appear correct. So NOT-RESOLVED is the
status of the whole report: lines 2 and 3 are still computed
(withholding them would hide information) but every number is
stamped [NOT-QUOTABLE] line by line; the withdrawal rules (spectrum
not converged / recording paths disagree) set the same status
whichever side of 2.2e-10 the value falls.

Two defects in writing it, both recorded. The loader split source on
the literal "def main()", a string that also occurs as data in ledger
11 (whose own loader splits on it) - a syntax error outright; the
same shape as the regex that matched its own injection fixture,
second time, same fix: recognise the construct, do not match its
spelling; both loaders now look for the line that is exactly
"def main():". And the file marked SYNTHETIC only in its case
headers, violating the per-line rule adopted minutes earlier - the
twelfth instance of a rule satisfied in prose and not at the point of
action, under ten minutes from adoption to violation, in the file
carrying that rule's own output. Now per line, with two independent
stamps: SYNTHETIC says where the number comes from, [NOT-QUOTABLE]
says what it may be used for; a line can carry both.

Current synthetic rendering:
  LINE 1: SYNTHETIC NO -- 5.000e-06 vs the 2.2e-10 needed; short by
          2.27e+04x
  LINE 2: SYNTHETIC [NOT-QUOTABLE] h=0.00: 0.655  h=0.03: 0.552
          h=0.08: 0.462  h=0.15: 0.393
  LINE 3: SYNTHETIC [NOT-QUOTABLE] minimum t that passes ... +2.000 m
When real data arrives, synthetic=False removes the SYNTHETIC stamp
and nothing else changes.

## Twelve recurrences is a base rate, not twelve findings (sci-rad-01 1fc24e4)

Counted rather than chased: rules stated in the receiver's record
(quoted, bold) 78; rules enforced by some callable 12 (15.4%).
Method stated first, because the number is worth only its method:
"stated" was counted by quoted bold sentences, which overcounts
(several restate each other) and undercounts (some rules sit in body
text). The twelve enumerated are the reliable half - rounding
direction, judgement words in prints, escaping numbers, card/ledger
range, label versus arithmetic, limits travelling with numbers,
qualification stamps, per-line synthetic marks, ratios derived from
a_dose, the two kinds of zero, the withdrawal rules, Poisson recorded
as untested; the ratio is approximate and its direction is not in
doubt.

All twelve recurrences fell in the ~85% that nothing enforces. Twelve
recurrences drawn from a population where 85% of rules are
unenforced is not twelve accidents; it is the rate. Each had been
reported as a finding; by the base rate, recurrence was the expected
outcome throughout. The record is a record of what was noticed, not
of what was prevented - two different products, and the first had
been used as the second. A stated rule is a description of good
practice; only an enforced one is a constraint. The correct response
is not to convert the other 66 to code (a check is built when a
conclusion needs it, not because a gap exists; 66 mechanisms nobody
consumes) but to stop expecting the unenforced ones to hold, and to
carry them honestly as what they are: things sometimes not done,
written down so that failure is visible when it happens, not so that
it does not happen. The receiver stops there and does not look for
a thirteenth.

The same statement holds for the integrator's memory file, which is
also a record of what was noticed.

## Segment 4 (windings) complete at 06:15:38Z

| item | value |
|---|---|
| duration | 05:18:17 -> 06:15:38 = 57.4 min |
| min/m simulated (0.95 m) | 60.4; bar 2 x 50.0 = 100 => in band |
| min/m segment (0.65 m) | 88.2, attenuation denominator, listed separately |
| exit records | 1238 (in 399,767; launched 400k; esc 3.095e-3) |
| albedo_at_cut | 0.0921 - largest on the chain (earlier segments 0.003-0.067) |

Both withdrawn predictions (21 min at 0.65, 30 min at 0.95) are off by
2-3x against the actual value; the thickness-linear degeneracy was
not a formality. Windings are the most expensive of the three
materials per simulated metre (60 against WC-B4C 13.9 and vessel
steel 50.0).

Two items for the delivery. First, the cut albedo loss is
systematic: the 9.2% of records that would have turned back across
the face in vacuum are killed after recording and do not enter the
next segment; direction is an underestimate of T, unconservative for
shield design, and it travels with the number. This is the
pre-registered per-joint bias, now measured directly per segment by
the chain (against the table: +5% per join -> 1.63x over ten,
+10% -> 2.59x), varying by segment (0.003-0.092) with concrete joins
still to come. The receiver is asked to list albedo_at_cut per
segment in the D_ref(t) limits and to judge whether it can serve as a
per-join multiplicative correction (a measured loss, not a fit); if
so the corrected T is on the upper side, if not, the t from D_ref(t)
is a lower bound only. The cut-count test still validates the
re-representation; the two are complementary. Second, 1238 exit
records move the statistical bottleneck from segments 1-2 to segment
4; the per-group chain minimum and "minimum at segment" columns
follow, and chain2b's multipliers (step1 x6.25, step2 x2.5) were set
on the old bottleneck and may need re-setting on segment 4.

Segment 5 (cryostat: 0.06 m steel plus the 0.30 m windings zone)
started 06:15Z; the five concrete segments have no cost data yet, so
no checkable CHAIN-DONE ETA exists until segment 6 stamps. 07:18Z
unchanged.

## Per-group chain minimum after segment 4: three dose-dominant groups below 18; ruling

| group | energy MeV | chain minimum | at segment | dominant |
|---|---|---|---|---|
| 0-9 | 1e-9 - 5.3e-4 | 0 | 1 | - |
| 10 | 5.3e-4 - 2.0e-3 | 19 | 1 | - |
| 11-14 | 2.0e-3 - 0.38 | 161 / 244 / 168 / 112 | 4 | yes (12-14) |
| 15 | 0.38 - 1.43 | 8 | 4 | yes |
| 16 | 1.43 - 5.35 | 0 | 4 | yes |
| 17 | 5.35 - 20 | 0 | 4 | yes |

Reading C. Meaning, from the producer: the bottleneck moved to
segment 4 (1238 exits); chain2b's multipliers set on the old
bottleneck (step1 x6.25, step2 x2.5) cannot lift g16/g17, whose zeros
sit at segment 4. From segment 5 every segment resamples those 1238
records, so g16-17 are exactly zero downstream by construction, not
measured zeros at depth; the delivery can state them only as one-
sided bounds - record share < 3/1238 = 2.4e-3 (95% one-sided, at
r = 2.925), tightening only downstream since concrete has no
mechanism producing neutrons above 1.4 MeV. Physically unsurprising
(g17 was already 16/5149 at segment 1, then 0.65 m of dense metal),
but "plausible" is not "measured". Lifting g16/g17 to >= 18 would
need segment 4 at x10 or more - a zero count gives no point estimate
of the factor, only a floor - at 57 min per x1, so >= 9.5 h, with no
importance sampling on the current binary.

Ruling: (a) deliver now with one-sided bounds and reading C, no
extra machine time; line 1 is decided by the well-populated groups
and is unaffected. chain2b is re-examined against the new bottleneck:
the producer is to state which dose-dominant group's chain minimum
its current multipliers can still lift; if none, chain2b is
cancelled (about 1.5 h saved); if some, only that part is kept.
(b) - segment 4 at x10 - runs only if a decidable condition holds:
the receiver computes the upper bound on the g16+g17 dose share from
the one-sided record share and the h ratio (integrator's rough
estimate below 3%, marked for the receiver's arithmetic); w >= 4%
means consider it, otherwise not, the same criterion as the earlier
5% decision. A zero count cannot size the run, which is a reason not
to run it blind. (c) energy splitting / importance weighting joins
the seed parameter and the progress line in the next compile.

The two zeros quantified from the ss files, not inferred:

| face | records | g15 | g16 | g17 | g16+17 share |
|---|---|---|---|---|---|
| ss_1 (r 2.475) | 5,149 | 1,039 | 56 | 16 | 1.40e-2 |
| ss_2 (r 2.775) | 64,714 | 5,825 | 47 | 19 | 1.02e-3 |
| ss_3 (r 2.925, segment 4 input) | 399,767 | 36,151 | 268 | 112 | 9.51e-4 |
| ss_4 (r 3.575) | 1,238 | 8 | 0 | 0 | 0 |

About 380 fast neutrons (g16+17) entered the windings in 400k
launches and none exited: fast survival < 3/380 = 7.9e-3 (95%
one-sided). The segment's total transmission, 1238/400k = 3.1e-3, is
smaller than that bound, so the data cannot even say the fast groups
attenuate faster than average - they were simply not seen. The
deliverable bound at r = 2.925 for g16+17 is record share < 3/1238 =
2.4e-3, i.e. n/s < 2.4e-3 x S_n x T4 - looser than the input share
of 9.5e-4, a genuine "not measured". Sizing chain2b on segment 4 has
a computable floor only: to see g17 >= 18 there needs x6 if fast
survival sits at the bound, x15 if it equals the average, more if
worse - no point estimate, an open interval from x6 up, at 57 min
per unit. Zero-count groups in the per-group n/s table are being
switched to one-sided bounds; the run is untouched.

## albedo_at_cut is a per-join bound, not a per-join correction (sci-rad-01 7d1b8e7)

It counts particles recorded crossing the face that, in the uncut
geometry, would have turned back and were killed instead. Of those,
after turning upstream, only some would scatter forward again and
eventually transmit - not all. So the relative loss of T at that
join is strictly less than the albedo fraction, and multiplying by
1/(1-a) over-corrects: it bounds the loss, it does not give it.
Hence a bracket, not a patch:

  T_measured <= T_true <= T_measured x prod 1/(1 - a_i)

Direction on the same line: the loss underestimates T, hence
underestimates escape, hence makes the shield look better than it
is - unconservative. What must be carried is the upper end, not the
midpoint; the midpoint is the number most naturally quoted and has
nothing to recommend it. Bracket widths: all joins at the measured
maximum 0.0921, n = 10 -> 2.628x; all at 0.03 -> 1.356x; segment 4's
one join alone -> 1.101x.

Consequence for line 3, entered in its limits: escape is
under-reported, so the t needed to meet the target is larger than
D_ref(t) says - the minimum t from D_ref(t) is a lower bound on the
required thickness, not the answer. At 3.8 decades/m in concrete
over ten joins: a = 0.03 per join adds about +3.5 cm; the measured
maximum per join adds about +11.0 cm.

Cross-check registered before the cut-count test runs: the cut-count
test measures the net per-join effect (albedo loss plus re-
representation); albedo_at_cut measures one named mechanism. If the
cut-count b is much larger than the albedo implies, a second
mechanism exists; if much smaller, the albedo bound is loose as
expected. The comparison is informative precisely because the two
are not the same quantity: two measurements of one quantity can only
agree or disagree; measurements of two different quantities can pin
a mechanism between them.

Request to the producer: albedo_at_cut per segment including the
concrete ones, for the product in line 3's limits; and whether the
killed particles carry any further count (how many would eventually
return forward) - that, and only that, would be a correction.

Also recorded: the two withdrawn time predictions (21 / 30 min) fell
2-3x short of the measured 57.4 min; the withdrawal on
unidentifiability was the right reason, not bad luck - two points
never supported them. And "no checkable ETA until segment 6 stamps"
is itself the correct shape of answer.

## Zero-count groups printed as one-sided bounds; chain2b as scoped is cancelled

Both tables in gen_source_term.py now print a zero group as
"0 | < 3/N | < (3/N) x S_n x T | one-sided 95%", never as 0, with a
line after the table listing the zero groups with N and 3/N and the
sentence: a group already zero at an upstream face is zero at this
face and deeper by resampling, not by measurement at depth - the
bound is meaningful only at that group's last non-zero face and
tightens downstream. The photon table prints zero groups as
"< 3/launches" with the gamma/s bound. Verified on the synthetic
chain at the main face. Producer's own catch on the way: a face with
all-zero photons turned out to be the vacuum-segment log standing in
for segment 5; real segments 1/2/4 have 839 / 3445 / 295 photons and
the vacuum segment's zero is expected. Gates 210 green.

Ruling on chain2b: as scoped (segments 1 and 2 enlarged) it lifts no
dose-dominant group - the segment-1/2 minima are in non-dominant
groups (g0-9 zero, g10 at 19) and g15-17 bottom out at segment 4. It
is cancelled; the waiting process is killed with the anchored pattern
and not restarted; chain2 and the cut-count test are untouched. A
"segment 4 enlarged" chain2b does not start now: it starts only if
the receiver's one-sided bound on the g16+17 dose share reaches 4%,
with a decidable stop condition stated in advance (g17 >= 18, or a
cap such as x15), given the open interval from x6 at 57 min each;
below 4% it does not run and the delivery carries one-sided bounds
and reading C.

## The w decision straddles its own threshold; one line of data settles it (sci-rad-01 cf33f7d)

Caught before sending: the receiver had taken "ss_4 is dominated by
g11-g14" and used h(1.5 MeV) = 422 to get w < 0.29%, a clean "do not
run". But g11-g14 are not at 1.5 MeV: g5-g12 are epithermal below
2.75e-2 MeV and g13-g17 fast, so g11/g12 sit just under that edge and
g13/g14 just over, with the bulk between 1e-2 and 1e-1 MeV where h is
17-88, not 422. A group label read as an energy without looking up
where the group is - clean, decisive, wrong; withdrawn unsent.

With the right energies the verdict straddles the threshold: bulk at
0.001 MeV (h 11) gives w < 9.95%, at 0.01 (h 17) w < 6.67%, at
0.0275 (h 35) w < 3.35%, at 0.1 (h 88) w < 1.36%; w = 4% falls at
h = 29.2, E = 0.0213 MeV - g13/g14 above it, g11/g12 below. Not
"close but decidable": genuinely undecidable with what the receiver
holds. The integrator's rough "below 3%" is one point on that curve,
valid if the bulk sits above 2.75e-2, and is marked conditional, not
a verdict. What closes it is data the producer already has: ss_4's
per-group counts for all 18 groups with the group edges; asked for,
numbers only. "I cannot compute it" versus "it need not be computed"
falls on the first side this time, and the first side must be said
rather than resolved by picking a branch that ends the question.

## chain2b cancelled (producer confirmation)

PID 9131 verified by /proc/9131/cmdline as "/bin/bash
./run_chain2b.sh" and killed by PID, not by pattern; no run_chain2b
process remains. Unaffected: chain2 main 3797, extension waiter 7786,
cut-count waiter 10264; the local chain2b watcher stopped; the
chain2b/ directory holds only its STARTED line and no product. On
"which dose-dominant group can the current multipliers still lift":
none - segments 1-2 set the minimum only for g0-10 (g0-9 zero, g10 at
19), all non-dominant; the dominant groups g12-14 (244/168/112,
already >= 69) and g15-17 (8/0/0) all bottom out at segment 4. About
1.5 h saved. (b) waits on the receiver's w bound at 2.4e-3 and a
stated stop condition; (c) is on the compile list. Albedo requests:
per-segment albedo_at_cut including concrete, with "cumulative T
upper bound (information) = load-bearing cumulative T x prod
1/(1-a_i)" labelled as a bound and not a correction, the load-bearing
column unchanged - being added; whether killed particles carry a
forward-return count is being read from stage.cc, answered next, not
from memory.

Answered from source (stage.cc lines 448-451, 673): albedo_at_cut =
returned_inward / launched, where returned_inward counts neutrons
crossing the inner face of the re-representation zone at
r = rcut - bufthick heading inward - the ones that leak out of the
zone's upstream side - after which they are not tracked. There is no
count of killed particles that eventually return forward; without
that quantity there is no correction, only the bound
T_meas <= T_true <= T_meas x prod 1/(1 - a_i). The receiver's
reasoning holds on the physics: a neutron that reaches the zone's
inner face has already crossed at least 0.30 m of material (0.06 m
for segment 6) and turned back, lower in energy and heading inward,
so its chance of returning forward and transmitting is below that of
an average launched neutron; the relative loss is strictly less than
a. The per-segment transmission table already printed albedo_at_cut
for every segment including concrete; it now adds "cumulative T
upper bound (information) = load-bearing cumulative T x prod
1/(1-a_i)" with the bracket factor itself printed, load-bearing
column unchanged, labelled a bound. The cross-check with the
cut-count test is registered; when both exist they print side by side
and the receiver judges.

## Bracket column in the delivery, real rows so far

| seg | seg | buf | out/launched | a | cumulative T (load-bearing) | prod 1/(1-a_i) | cumulative T upper bound (info) |
|---|---|---|---|---|---|---|---|
| 1 | shield 0.12 | lipb 0.30 | 1.287e-2 | 0.0674 | 5.985e-4 | 1.072 | 6.417e-4 |
| 2 | steel 0.30 | shield 0.12 | 1.618e-1 | 0.0029 | 9.683e-5 | 1.075 | 1.041e-4 |
| 3 | vac 0.15 | steel 0.30 | 0.9994 | 0.0000 | 9.677e-5 | 1.075 | 1.041e-4 |
| 4 | wind 0.65 | steel 0.30 | 3.095e-3 | 0.0921 | 2.995e-7 | 1.184 | 3.547e-7 |

Three sentences fixed under the table: the definition of a with its
source lines; no forward-return count exists, so no correction, only
the bracket T_meas <= T_true <= T_meas x prod 1/(1-a_i), with the
receiver's reasoning verbatim; the upper-bound column is
informational, the load-bearing column unchanged, and the direction
is an underestimate of T, unconservative. Concrete segments append
automatically. Gates 210 green. To-do list updated: chain2b
cancelled; a segment-4 enlargement starts only at w >= 4% with a
stop condition; (c) on the compile list. Segment 5 running; the
06:53Z and 07:18Z watchers unchanged.

## The 4% criterion was the wrong tool here; replaced by a decision-flip test (sci-rad-01 cfe8727)

Correction first: the data had already been sent - "g11-14
161/244/168/112 at 4" means the chain minimum sits at segment 4, so
those are ss_4's counts; the receiver read a minimum table as a
composition table. With g15 = 8, g16 = g17 = 0, total 1238, g0-10 =
545. Maximising w by assigning every non-g16/17 record its lowest
plausible h: 6.94% (extreme), 5.42%, 3.81%, 2.14% - still straddling
4%. But the 4% rule was written for populated groups: g17 had 16
counts, 25% relative error, "does 25% on w move the total by more
than 1%". g16+17 here are zero counts: the share is not "uncertain
by 25%" but "unknown between 0 and the bound". Applying a
populated-group rule to an empty group is the two-kinds-of-zero
distinction one level up, and the receiver had not carried it over.

The applicable question, and it costs nothing: not "is w large" but
"can w's entire possible range move a verdict". Conservative line
0.038099: a D_ref in [0.035627, 0.038099] could be pushed over;
permissive line 0.091412: [0.085480, 0.091412]; each band 6.5% wide.
Rule: if the reported D_ref lands within 7% below either threshold,
the segment-4 rerun is needed; otherwise the whole unmeasured range
moves nothing and it is not run. The ratios in play are 2.6-5.1x the
design assumption, far from a 7% shift; the only exposure is a D_ref
sitting just under a line, checkable against the number that arrives
anyway. Implemented as unmeasured_group_can_flip(), not a sentence;
rehearsal: 0.0370 -> can flip the 0.038099 line, 0.0400 -> cannot.
A rule carried outside the situation that produced it is not a rule
being followed; it is a number being carried.

Full ss_4 composition (producer, from the file, N = 1238, 18 log
groups 1e-9 to 20 MeV): g0-4 0; g5 17; g6 34; g7 80; g8 90; g9 107;
g10 217; g11 161; g12 244; g13 168; g14 112; g15 8; g16 0; g17 0.
Above 2.75e-2 MeV: 288 records (0.2326); median energy 3.562e-3 MeV,
mean 3.221e-2, maximum 0.714; g16+17 one-sided bound 2.42e-3.
Integrator's ruling updated: the segment-4 rerun condition is the
flip test on the arriving D_ref, replacing w >= 4%.

## Two predictions on the cut albedo, filed before segment 6 (sci-rad-01 4a8d3ce, 06:29Z)

From the source definition, a is not the face's albedo but the
re-representation zone's failure rate: it counts neutrons that
cross the zone's inner face heading upstream, so a neutron that
turns back across the cut but is stopped inside the zone is still
tracked and not counted - and stopping them is the zone's whole job.
Hence a should be governed by the zone's thickness and material,
which can be stated before the numbers exist.

Prediction 1: segment 4 had a 0.30 m steel zone and a = 0.0921;
segment 6 has a 0.06 m steel zone, same material five times
thinner, so a(seg6) must be clearly higher than 0.0921 - across
plausible return attenuation lengths, of order 0.15-0.46. The
prediction is a direction, not a magnitude: if a(seg6) is not
clearly higher, a is not governed by zone thickness and this whole
reading is wrong.

Prediction 2: segments 7-10 have 0.30 m concrete zones, equal in
thickness to segment 4's steel, so a should be <= 0.0921 - at equal
thickness concrete stops returning neutrons better than steel,
hydrogen moderating particles that are already low in energy and
heading inward.

Why this matters more than the bracket itself: segment 6 is the
first concrete join, nearest the source, and the only thin zone. At
a(seg6) = 0.20 that single join contributes 1.250x; at 0.40, 1.667x;
at 0.60, 2.500x. A thin-zone join could dominate the whole product,
in which case the product is not "ten small losses accumulated" but
"one large loss plus nine small" - and the two mean different things
for the design: the first calls for redoing the segmentation scheme,
the second for thickening one zone.

Unnamed until now: the two deconfounding runs answer a second
question at zero extra cost. Ordered to isolate f, they also give a
at two zone thicknesses (seg1 at 0.04 vs 0.08; concrete at 0.25 vs
0.50) - the design question "how thick must the zone be for a to be
negligible", which is worth more than correcting T because it
removes the loss rather than bounding it. Request to the producer:
print each segment's zone thickness and material beside its
albedo_at_cut, or the relation cannot be read.

Also recorded: the producer walked the "strictly less than a"
reasoning itself rather than copying the conclusion.

Producer's implementation: the chain table's buf column (material
and thickness, e.g. "steel 0.3", and "steel 0.06" for segment 6)
already sits beside the a column; the cut-count analysis now prints
"seg / buf / a = albedo_at_cut" per sub-segment for both slabs, with
the title stating "a = re-representation zone failure rate, not face
albedo" - the producer's reading of its own source agrees with the
receiver's; the deconfounding pairs' a values print side by side so
"how thick a zone makes a negligible" is read by the receiver.
Checked on existing data: slab 1, n = 1 prints buf lipb 0.30,
a = 0.0674. The two predictions are recorded verbatim as the
receiver's; when segment 6 stamps the producer reports a(seg6) as a
number only. Segment 5 at 14 min at 06:30Z.

## w is a number; and the same data says something nobody had said (sci-rad-01 e9ff6a7)

Group structure self-checked before use: 18 log-equal groups from
1e-9 to 20 MeV put the g13 lower edge at 2.752e-2 MeV, matching the
reading rules' fast edge - confirmed, not assumed. From the ss_4
composition: w measured (zero counts) = 0; w upper bound (< 3
records, 95% one-sided) = 3.07%. The earlier rough bounds ranged
2.1-6.9% depending on where the bulk was placed; the measured
spectrum fixes it. Flip bands narrow accordingly: conservative
[0.036964, 0.038099], permissive [0.088688, 0.091412], each 3.07%
wide. The registered rule said 7%; it stands as written - it was
conservative at the time and the true band is narrower, which only
makes a rerun less necessary. A pre-registration that turns out
loose in the safe direction is not a defect. The code uses the
measured 3.07%, the registered 7% remains on record, both agree in
direction.

Stated before the first concrete segment reports its rate: at
r = 3.575 the load-bearing cumulative T is 2.995e-7 against a target
of 2.2e-10, 3.13 decades short before the cryostat and the concrete.
Concrete needed at 1.00 decade/m: 3.13 m (band floor); at 2.50:
1.25 m (top of the dry-recipe branch); at 3.13: 1.00 m; at 3.80:
0.82 m (in-band assumption); at 6.00: 0.52 m (band ceiling). So
1.0 m of concrete suffices if and only if the rate is >= 3.13
decades/m - in band, but above the dry-recipe branch (1-2.5) that
the reading rules explicitly say "do not suspect". The branch that
needs no suspicion is at the same time the branch in which 1.0 m is
not enough. The reading rules were written to stop a low rate being
mistaken for a fault; nothing in them looks at thickness. This is
decidable the moment the first concrete segment reports its rate,
at zero cost, and it is said now for the same reason as everything
else in this file: afterwards, whichever branch is convenient will
have a story available.

Integrator's note: "1.0 m" here is not a city-declared bio-shield
thickness - the producer's ledger declares none, and this file
defines the required thickness as the smallest t with D_ref(t) below
the conservative line. The 1.0 m is asked about (the cut-count slab
thickness, or something else) rather than assumed; the point stands
for any candidate thickness read against the rate.

Answered (sci-rad-01 9deb6d7): the 1.0 m was the cut-count test
slab - "same slab, same thickness, 1.0 m of borated concrete from
ss_5" - a specimen ordered to measure per-joint bias, not any planned
thickness. A number about one thing used as a number about another,
the same shape as "regional ice data is regional, not site", praised
two hours earlier and then repeated with a test slab. The structural
point survives without any thickness: required concrete = 3.13 /
rate metres, 0.52 m at the band ceiling (6.0 decades/m), 3.13 m at
the floor (1.0), 1.25-3.13 m inside the dry-recipe branch alone; the
"do not suspect" branch is the expensive end, and the required
thickness is undetermined across a factor of six. But "the planned
thickness is not enough" implied a plan that does not exist: a true
structural judgement dressed in a false concrete coat, and the coat
is what made it sound urgent. A manufactured stake is worse than
none, because it survives correction - the judgement underneath is
right, and the reader remembers the alarm. The phrase "planned
thickness" is struck; the claim is restated as: required thickness =
3.13 / rate m, undetermined between 0.52 and 3.13 m, and the
low-rate branch is both the "do not suspect" branch and the "needs
more" branch - true for any candidate thickness.

Consistency check forced by the question: 2.2e-10 was derived at the
conservative end; A_DOSE_MAX (0.679) did not move, so it is
unchanged; the 0.344 -> 0.283 restatement moved only the permissive
line. Checked, not assumed - a target value that silently follows a
moved parameter is exactly what ledger 10 had to structure.

Declared blind spot, no gate built (a gate is built when a
conclusion needs it): check_provenance verifies that a number
matches the arithmetic its label states; "1.0 m" had no arithmetic
and no label - a dimension carried from another party's message into
a sentence about design. The gates cover numbers the receiver
computes; they do not cover numbers it restates.

## Main delivery face reached: r = 4.235 m, 06:31:23Z

Segment 5 (cryostat: 0.60 m vacuum + 0.06 m steel; re-representation
zone windings 0.30 m) completed 06:31:23Z.

| item | value |
|---|---|
| duration | 15.8 min; simulated 0.36 m => 43.8 min/m, bar 100, in band |
| a(seg5) | 0.0104 |
| T at r = 4.235 m | 1.639e-7 (relative error 0.033, 218,898 records) |
| qualification gate, line 1 | NOT RESOLVED; target 2.2e-10; 2.87 decades short |
| zero-count groups at the main face | {0, 1, 2, 16, 17} => 3/N = 1.37e-5 one-sided (g16/17 are zero by resampling; their meaningful bound is 2.4e-3 at r = 2.925) |
| bracket prod 1/(1-a_i) through segment 5 | 1.197x (upper bound 1.962e-7) |
| ratio to the earlier bound 1.5e-5 | 0.011 |

The delivery regenerated on the main face (225 lines: full 18-group
table, photon table, discriminators, both cost columns), version
stamp unchanged. The escape bound of this morning, < 1.5e-5, is now
a measurement 92x tighter at the same surface. Required concrete is
restated from 3.13/rate to 2.87/rate metres with the cryostat
counted. Segment 6 (first concrete, 0.50 m, zone steel 0.06 m - the
join of prediction 1) started 06:31Z; its a will be reported as a
number only. The 06:53Z decidable point now belongs to segment 6;
07:18Z unchanged. The producer offers no estimate of the concrete
needed for the remaining 2.87 decades: segments 6-7's own rates will
say.

Two defects caught by the producer reading the full main-face
tables, fixed and regenerated: the thermal/epithermal confirmation
column printed "0.002 +/- 0.000" - false precision, the same family
as the earlier "0.000 +/- 0.000", where only the zero-count branch
had been fixed and the format for small non-zero values had not;
now scientific notation, 2.352e-3 +/- 1.2e-4. And the photon
channel's "this segment" definition was hard-written as "the 0.5 m
segment plus the 0.30 m zone (0.06 m steel for segment 6)", which is
false at the main face (the cryostat segment); now read from the
segment log's seg/buf fields, printing "seg vac 0 + zone wind 0.3"
there. Both are the one shape "format or wording fixed before the
data". Gates 211 green.

## First real three-line report: line 1 is a third state, not "no" (sci-rad-01 40d2c28)

The integrator had told the receiver to report line 1 as "no, 2.87
decades short". That was a misreading, withdrawn: the registered
question asks about the outermost concrete face, and no concrete
face exists yet - segment 6 started at 06:31Z. The 1.639e-7 at
r = 4.235 is the concrete's inner boundary, t = 0. Reporting "no"
would be true of the number and false of the chain: it would read
as "the shield failed" when the shield has not yet been simulated -
the two kinds of zero raised to the level of the verdict. Line 1
therefore carries a third state.

Report as issued (SYNTHETIC stamps removed):
  LINE 1: NOT YET ANSWERABLE -- no concrete face exists. At the
          concrete INNER boundary (t = 0) the value is 1.639e-07,
          2.87 decades from the target. A starting point, not a
          verdict.
  EVERY NUMBER BELOW IS STAMPED NOT-QUOTABLE.
  LINE 2: [NOT-QUOTABLE] no leakage spectrum supplied -- a_dose
          cannot be collapsed
  LINE 3: [NOT-QUOTABLE] no face passes at the conservative end
          [NOT-QUOTABLE] r=4.235 t=+0.000 esc=1.6e-07 -> D_ref
          3.002e+01 mSv/yr [FAILS]
          (the four inner faces in the same format, all out of
          domain)

Line 2 is empty because the main face's 18-group spectrum was not
supplied as numbers; ss_4's spectrum belongs to another face and may
not stand in (a number about one thing used for another). Requested
from the producer; on arrival line 2 becomes the four moistures side
by side.

A consistency check nobody had run: by the escape route,
log10(1.639e-7 / 2.2e-10) = 2.872 decades; by the dose route,
log10(30.02 / 0.038099) = 2.896. They agree; 2.2e-10 and 0.038099
were derived on different days from different criteria and nothing
had compared them before. The 0.024 gap is rounding.

Required concrete restated with the cryostat counted: 2.87 / rate m
- 2.87 m at 1.0 decade/m, 1.15 at 2.5, 0.96 at 3.0, 0.76 at 3.8,
0.48 at 6.0; a factor of six across the band. "No planned thickness
to compare against" stays in the limits column as a statement, not
an omission. Two inputs awaited, after which the same call reruns:
the main-face 18-group counts, and a(seg6) - the prediction-1 join,
steel 0.06 m zone, which must read clearly above 0.0921, direction
being the criterion.

Main-face composition supplied (ss_5.txt, r = 4.235 m, t = 0,
N = 218,898; counted independently from the face-source file and
matching the delivery's SPEC_N table group by group except g6 by one
record, 8780 vs 8781, edge rounding): g0-2 0; g3 11; g4 381; g5
2744; g6 8780; g7 13620; g8 16770; g9 23246; g10 34089; g11 25844;
g12 41574; g13 27384; g14 23200; g15 1255; g16 0; g17 0. Above
2.75e-2 MeV: 51,840 (0.2368); median energy 2.721e-3 MeV, mean
3.411e-2, maximum 0.714. g16/17 are zero by resampling with their
bound still 3/1238 at r = 2.925; g0-2 are zero for the first time at
this face, so 3/N = 1.37e-5 is meaningful here. Line 2 can now be
issued as four moistures side by side, still NOT-QUOTABLE under a
line 1 of NOT YET ANSWERABLE. The producer adopts the receiver's
line-1 wording: its "not resolved" had meant "the chain has not
reached there", not "the shield failed", and would have been read as
the latter.

Line 1 in the delivery now has three branches, chosen by whether the
outermost completed face is a concrete segment, read from the log's
seg field rather than selected by hand, and both non-passing
branches were verified: with no concrete face, "NOT YET ANSWERABLE:
no concrete face yet; r = 4.235 is the concrete inner boundary
t = 0, not the face asked about; 2.87 decades remain from here (the
chain has not reached there, not a shield failure)"; with a concrete
face short of target (checked on the synthetic chain), "not
resolved, 2.48 decades short (chain at t = 1.50 m)"; and "resolved"
under the unchanged condition T <= 2.2e-10 with >= 18 records.
Gates 211 green.

## Line 2 issued; the threshold update it implies, and the ruling on it (sci-rad-01 99c6940)

The receiver re-summed the main-face table independently (218,898,
matching; fast-band 51,839 against the producer's 51,840, one record
at an edge) before using it. Line 2, still NOT-QUOTABLE under a
NOT YET ANSWERABLE line 1:
  h=0.00 a_dose 0.658   h=0.03 0.538   h=0.08 0.458   h=0.15 0.405
  clamped weight 0% at all four - no extrapolation.
The energy axis is gone; what remains is entirely water: the range
0.283-0.679 (span 2.40) becomes 0.405-0.658 (span 1.62), the residual
being the village regolith moisture that the village has declared
undecided. The criterion-relevant ratio narrows to 3.04x-4.95x the
design assumption (published 2.59-5.11x over the full range).

Implied threshold update, which the receiver declined to apply
unilaterally: thresholds derive from A_DOSE_MAX/MIN, so with the
collapsed values the conservative line moves 0.038099 -> 0.039315
(+0.001216, looser, easier to pass) and the permissive 0.091412 ->
0.063876 (-0.027536, tighter). The rule takes a_dose as input, so
substituting a measured value is expected, not goalpost-moving; but
the conservative line moves in the loosening direction, and
loosening a threshold after seeing data is the suspect direction
however proper the reason. A correct procedure and a convenient
result look the same from outside; the party that benefits should
not be the one deciding. The receiver reported both pairs, named
the direction, declined to adopt only the tightening half (picking
the strict half of a two-way update is itself selective), and
passed the decision up.

Ruling: adopt the recomputed pair as governing, as a pair; keep the
registered pair on record. Grounds: the collapse was pre-registered
as the step that narrows the envelope with direction unknown, and
the thresholds were pre-registered as derived from a_dose - refusing
the update would itself be a post-hoc choice, retaining an envelope
value known to be superseded by measurement. The receiver naming the
direction, reporting both, and handing the decision to the
non-benefiting party is what makes a correct procedure
distinguishable from a convenient result. Lock added so that the
loosened half cannot by itself produce a pass: any D_ref that
passes under the recomputed pair and fails under the registered one
(the band [0.038099, 0.039315]) is reported "threshold-dependent",
not a pass, treated as inside the flip band, and triggers the
segment-4 rerun test; a verdict is issued only where both pairs
agree. The same lock applies at the permissive line.

Producer's check before complying: none of the four threshold
values appears anywhere in the delivery or its generator - the
delivery carries per-face 18-group n/s and the g16+17 one-sided
bound, and thresholds are used only on the receiver's side. So
"print both pairs where quoted" has nowhere to land in the delivery
and is not forced in. Its to-do entry now reads: judgement belongs
to the receiver; wherever quoted, print both pairs (registered
0.038099 / 0.091412; governing 0.039315 / 0.063876); lock: a D_ref
in the band where the pairs disagree is reported threshold-dependent,
not a pass, treated as inside the flip band. Gates 211 green.

## Ruling adopted; the lock implemented and self-tested (sci-rad-01 5c8282a / 0809665)

Before accepting, the receiver checked its own document rather than
the integrator's paraphrase of it. Ledger 10 lines 94-95: "when it
arrives, this envelope collapses to one number - and the direction
of the collapse is not known in advance." The quotation was
accurate; the update is the registered procedure itself and refusing
it would have been the post-hoc choice. The receiver accepts that as
a correction of its position and shrinks its own contribution to
size: what made the update legitimate is the pre-registration, not
the deferral; the deferral added "this step is checkable from
outside", a smaller and separate thing.

threshold_verdict() self-test, biting exactly where the pairs
disagree and nowhere else:
  D_ref 0.0300 -> PASSES at the conservative end
  D_ref 0.0385 -> THRESHOLD-DEPENDENT   (the loosened gap)
  D_ref 0.0500 -> depends on which end of a_dose applies
  D_ref 0.0700 -> THRESHOLD-DEPENDENT   (the tightened span)
  D_ref 0.1000 -> FAILS even at the permissive end
The loosened half cannot produce a pass alone; the tightened half is
not used alone either. Adopting a two-way update as a pair and
issuing "no verdict" where the pairs disagree turns the uncertainty
about which pair is right into an explicit refusal to rule, rather
than an invisible selection.

Cost stated: the permissive line tightened 30%, so the threshold-
dependent band [0.063876, 0.091412] plus the small conservative gap
covers a large part of the plausible D_ref range where no verdict
issues. That is the price of holding two credible pairs; picking one
would issue verdicts everywhere, and they would be worth less than
this refusal because they would be products of the pick.

Gate earning its keep: the receiver typed 0.038099 into the lock's
self-test and check_escaping_numbers went red; fixed, not
classified - the gap now prints from two constants. The gate built to
make new numbers red by default bit its first new number ten minutes
after it was typed.

Main-face D_ref 30.02 through the lock: FAILS even at the permissive
end, both pairs agreeing, outside the lock's band - and it is t = 0,
not a verdict. Only a(seg6) remains awaited.

## Segment 6 (first concrete, 0.50 m, r 4.235 -> 4.735) complete at 06:41:16Z - numbers first

| item | value |
|---|---|
| launched / exited | 400,000 / 2 |
| esc (this segment) | 5e-6 => 5.3 decades over 0.50 m = 10.6 decades/m |
| pre-registered band | 2.5-6 normal; > 6 => suspect the chain first - this segment lands there |
| a(seg6), zone steel 0.06 | 0.117 (returned_inward 46,792). Prediction 1: "clearly above 0.0921" holds; "of order 0.15-0.46" does not |
| duration | 9.9 min; simulated 0.56 m => 17.7 min/m |
| photons | 369 counts, spectrum normal |
| the two exits | E = 1.55e-5 and 1.84e-4 MeV, u_r 0.99 / 0.98 |
| cumulative T at t = 0.5 m | 1.639e-7 x 5e-6 = 8.2e-13 - below 2.2e-10, but 2 records < 18: starved, not resolved |

Following the receiver's rule the producer suspected the chain first
and checked what it could without changing anything: G4Exception 0;
geometry r_outer 4.735 and albedo_face 4.175 (= 4.235 - 0.06)
correct; segmat=bcon maps to BoratedConcrete (2.35 g/cm3, 97%
G4_CONCRETE + 3% B4C => 2.35 wt% B, declared self-set); input
spectrum 76% below 27.5 keV, median 2.7 keV. Its physical account,
offered as reasoning not measurement and left to the receiver: a keV
bulk thermalises within tens of centimetres in hydrogenous concrete
and 2.35 wt% boron eats the thermal and epithermal groups; only the
11% above 0.1 MeV can cross 0.5 m and still faces a removal cross
section of ~0.1-0.15/cm; 10 decades/m is "heavy boron plus soft
spectrum", not the fast-removal 2.5-6 band.

Integrator's question put to the receiver: about 24,000 records
above 0.1 MeV entered segment 6; at an in-band fast removal of 2.5-6
decades/m, 0.5 m should leave ~50-1,000 exits, and the actual two are
both keV - the hard component vanished too, which "boron eats the
soft spectrum" does not explain. A grazing angular distribution at
the face (effective path far exceeding 0.5 m) could; ss_5's mu
distribution exists and is requested for all records and for the
> 0.1 MeV subset, zero cost.

Consequences if nothing changes: segment 7 launches 400k from 2
records (no statistical meaning), likely 0 exits, the chain
self-exhausts to CHAIN-DONE; the extension has no records to
continue; the concrete cut-count slab dies (n = 1 at 1.0 m expected
0 records, n = 2 is this segment's 2), and n4a (0.25 m from ss_5,
about 900 records at 10.6 decades/m) is the only well-populated
point.

Options offered by the producer, run untouched pending ruling:
(i) one added 0.30 m segment from ss_5 (400k, ~6 min): ~250 records,
cumulative T ~1e-10 <= target, line 1 could read "resolved" on
records; (ii) segment 6 at x10 (4M, ~100 min): ~20 records at
t = 0.5 m, barely qualifying; (iii) add nothing and wait for the
cut-count n4a-d (queued) to give t = 0.25/0.50/0.75/1.0 for cross-
checking this segment's rate. None replaces the receiver's "suspect
the chain" ruling: the independent method gate reaches only
r = 2.775 and no concrete segment has one.

Integrator's provisional ruling, judgement reserved to the receiver
whose band it is: (iii) runs as queued; (i) approved, after the
cut-count batch, as a second same-material point for the rate-
stability check - but it cannot turn line 1 to "resolved": by the
pre-registration, > 6 decades/m means suspect the chain first and
the deep number is not citable, independent of record count; (ii)
not run. The question for the receiver: is 10.6 decades/m a chain
fault, or a domain fault of the band - written for a fast spectrum
when the spectrum entering the concrete is not fast?

Delivery regenerated on segment 6 (322 lines, stamp unchanged): line
1 takes a new branch, "unqualified (statistical starvation): T is
already below target, but this face has only 2 records (< 18); chain
at t = 0.50 m"; the deep-region table prints "10.60 decades/m |
> 6: suspect the chain" by script from the receiver's registered
wording; chain row 6 has a = 0.1170 and bracket 1.356x through
segment 6; cost row 0.56 m / 9.9 min / 17.6 min/m.

From the driver code, what follows without intervention: segment 7
launches 400k from 2 records (~10 min, no statistical meaning), ss_7
is empty => "chain exhausted" => CHAIN-DONE; the extension scans,
finds segment 6 at T <= target with 2 < 18, runs one more from ss_6
(~10 min), ss_7 empty => "exhausted" => EXT-DONE. Both terminate on
their own.

Two zero-physics changes to the cut-count script, re-hung without
waiting for a ruling (old waiter PID 10264 verified by cmdline and
killed by PID, new PID 16274, hash ca75056887983b01 on both sides,
the 15 run lines unchanged): an empty sub-segment input is recorded
SKIP and skipped rather than aborting - the original logic would
have aborted on n4d's empty input and blocked every later slab, and
an empty input is a test result, not a fault; and the WC-B4C slab
runs first (s3, t3, then n1, n4, then m4), since it has counts and
should not wait behind a starved concrete slab. Producer's stated
grounds: no physics, no run line, only order and failure handling
changed, and re-hanging after EXT-DONE would be too late; it invites
the integrator to say so if this overstepped. Integrator: within
bounds - execution order and failure handling of a queued batch, no
run line touched, reported with PID and hash.

Option (i) prepared as run_probe.sh THICK_m [NL] (hash
062e685bc30e7365, VM and repository), not started: one added segment
of borated concrete of thickness THICK from the t = 0 face, zone
identical to segment 6's (steel 0.06), starting only after EXT-DONE
and CUT-TEST-DONE, products to probe_<THICK>/, chain2/ untouched,
STARTED/PROBE-DONE stamps. The producer declined to choose the
thickness and made two points: the 0.30 m it had suggested was
back-derived from this segment's 10.6 decades/m, and if the chain is
under suspicion then a probe thickness derived from its slope is
under the same suspicion; and a 0.25 m probe would be bit-identical
to the cut-count n4a (same source, same zone, no seed entry) - a
zero-information repeat. The informative comparison is n4a's own
rate against 10.6, already queued.

Ruling: the probe is not started; the script is kept. n4a-d already
give four same-source, same-zone thicknesses (0.25/0.50/0.75/1.00 m),
which is exactly what the rate-stability check needs, and the probe
adds nothing they lack. Option (i) is withdrawn; it may be revived
after CUT-TEST-DONE only if the receiver names a thickness and
states what it answers that n4a-d cannot.

## CHAIN-DONE 06:45:41Z, 33 min before the 07:18Z line, as the code predicted

  06:45:41 step7 bcon 0.50 m @4.735 rc=0 in=2 launched=400000 esc=0
           albedo=2.5e-06 out=0
  06:45:41 step8: upstream ss_7 empty -> chain exhausted, stopping
  CHAIN-DONE
  06:46:13 ext start: after step 6 cumulative T=8.195161e-13
           target=1.92e-10

Segment 7 finished 400k launches in 4.4 min: both source records
were eV-scale (15 eV, 184 eV) with very short histories - the
necessary result of resampling two records, not data. The extension
now runs one more segment from ss_6 (~4 min), finds it empty, and
declares EXT-DONE around 06:51Z; the cut-count waiter (PID 16274)
then starts with the WC-B4C slab first. The 06:53Z and 07:18Z
watchers will print DEADLINE-OK. The probe ruling (not started)
crossed with this message.

## Receiver's judgement on segment 6: not a chain fault, not a band fault - a denominator mismatch, the third (sci-rad-01 b8c04af)

Line 1 does not turn, and the danger is the reverse of the one
registered: cumulative T = 8.2e-13 is below 2.2e-10 and looks
resolved, on 2 records. The 95% Poisson interval on 2 observed is
esc 6.1e-7 to 1.8e-5, i.e. 9.5-12.4 decades/m. The registered floor
is >= 18 effective counts; 2 is starvation, unqualified, not citable.
The qualification rule was written against "unresolved but quoted";
this one looks resolved, which is worse - nobody has an incentive to
check a result that says you are done.

10.6 decades/m is neither a chain fault nor a domain fault of the
band: the 1-6 band is a material property, decades per metre of
path (removal cross sections are defined per path length), while
10.6 is decades per metre of slab thickness. The two coincide only
at normal incidence. At <1/mu> = 1.0 the rate is 10.60; at 1.5,
7.07; at 2.0, 5.30 (in band); at 2.5, 4.24 (in band). "Decades per
metre": the decades were measured and the metres assumed - assumed
to be slab thickness. Third appearance of the shape, and the first
that nearly changed a delivered verdict. For design, the slab-
thickness number is the right one: if 10.6 stands, the concrete
needed is about 0.27 m, not 0.48-2.87 m. The band was never a design
quantity; it is a physical plausibility check that had been comparing
against a number in a different unit.

What the receiver will not do: the trigger fired; it has a plausible
non-fault explanation; that is a hypothesis, not a measurement.
Explaining away a pre-registered trigger with an untested hypothesis
is exactly what pre-registration exists to prevent. The trigger
stands until <1/mu> is computed from the mu distribution the
producer holds. Line 1 does not turn on the receiver's diagnosis,
and no added segment can turn it.

Discriminator: both explanations fit the two observations (exits
soft, 1.6e-5 / 1.8e-4 MeV, and near-radial, u_r 0.99 / 0.98).
Grazing path geometry gives a fixed secant factor and a rate
constant with depth; moderation plus capture kills the soft bulk
near the surface and gives a rate falling with depth, then a
plateau. n4a-d at t = 0.25/0.50/0.75/1.00 m measure that curve -
queued, zero cost, and exactly what ledger 11's spectral-equilibrium
and rate-stability checks were written to do before any of this
happened. The mu distribution is the primary test and gives a
decomposition rather than a binary: 10.6 / <1/mu> inside the band
means geometry explains it fully; still outside, the residual is
moderation plus capture and its size is named.

Receiver's ruling: (iii) runs as queued - not a cross-check but the
discriminator itself; the mu distribution is printed first; (i) runs
only as a second same-material point for the rate-stability check
and may not turn line 1; (ii) not run. Integrator holds the
withdrawal of (i): n4a-d already are four same-source, same-zone
points, which is what the rate-stability check needs, and a probe
adds nothing they lack; it is revived only if the receiver names a
thickness n4a-d do not cover and what it answers. Producer asked to
print <1/mu> for all of ss_5 and for the > 0.1 MeV subset, and
10.6 / <1/mu> for both, numbers only.

Prediction 1: direction passed (0.117 > 0.0921), magnitude failed
(the registered 0.15-0.46 sits above it); the inverted return
attenuation length is 1.0 m against the 0.15-0.50 m considered. The
receiver's own reading rule 2 says why - iron's 24 keV transmission
window makes deep-penetration attenuation far weaker than the removal
cross section suggests - and it wrote that rule and then estimated
the magnitude as if it did not exist. Segment 6's two records are
entered as STARVED and do not enter the verdict; line 1 remains
NOT YET ANSWERABLE.

## The angular distribution: geometry does not explain it; the hard component is more forward than the bulk

ss_5 mu = u_r in 8 bins, numbers only (all records are exits, none
with mu < 0):
  all N = 218,898: shares .0075 .0276 .0550 .0885 .1247 .1699 .2270
  .3000; mean mu 0.718; mean 1/mu 1.703; share below 0.25: 0.0351
  > 0.1 MeV, N = 24,696: .0065 .0243 .0481 .0769 .1053 .1574 .2253
  .3563; mean mu 0.744; mean 1/mu 1.631; share below 0.25: 0.0309
  > 0.384 MeV (g15), N = 1,255: mean mu 0.778; mean 1/mu 1.593
The hard component is more forward than the bulk: its effective path
is only 63% longer than normal, and 10.6 / 1.63 = 6.5 decades per
metre of path, still just outside the 2.5-6 band. Grazing incidence
does not explain the disappearance of the hard component.

Producer's account of what can, hand-computed with cross sections
from memory, for magnitude only, judgement left to the receiver:
from the delivery's material table (rho 2.35; H 0.0097, O 0.513,
Si 0.327 by mass) n_H 1.36e22, n_O 4.54e22, n_Si 1.65e22 per cm3. At
0.1-0.4 MeV, sigma_H ~8-13 b, sigma_O ~3.7 b, sigma_Si ~4 b give
Sigma_t ~0.40-0.47 /cm, a mean free path of 2.2-2.5 cm, so 0.5 m is
20-23 mean free paths; with removal in a hydrogenous medium at
~0.6-0.75 Sigma_t ~0.27 /cm, that is ~5.9 decades per 0.5 m, i.e.
11-12 decades/m. The same material against a fission or 14 MeV hard
spectrum (sigma_H 2.9 b at 2 MeV, sigma_O 1.5 b) gives Sigma_t
~0.16 /cm, Sigma_R ~0.10, about 4 decades/m - inside the receiver's
2.5-6 band. So the band is a hard-spectrum band; the spectrum
entering segment 6 is already soft (0.6% above 0.384 MeV, 11% above
0.1 MeV), and the self-removal of 0.1-0.4 MeV neutrons in this
concrete is of order 10 decades/m. The measured 10.6 is of the same
order as this estimate. Offered as a physical reason the number is
not anomalous, not as proof the chain is right. Put to the receiver:
is this a domain fault of a band written for a hard spectrum, with
the residual 6.5 versus 6 being energy-dependent removal rather than
geometry? The n4a-d depth curve remains the discriminator (moderation
plus capture: falling then plateau). EXT-DONE path under verification
by the producer (exhausted branch breaks to finish 0).

EXT-DONE 06:50:37Z: the extension ran step 7 from ss_6 (400k
launched, albedo 2.5e-6, 0 out, cumulative T 8.195e-13), found ss_7
empty, declared exhausted; the exhausted branch breaks straight to
the EXT-DONE line without passing ABORT. The cut-count waiter (PID
16274, STARTED 06:47:56Z, 120 s polling) starts the WC-B4C slab
around 06:52Z. The chain2 delivery is being regenerated on the final
logs (segment 7's zero exits enter no table). The 07:18Z watcher will
print OK.

A loop the receiver caught in the integrator's relay (0120ddd): the
"about 900 records at n4a" quoted as the comparison for segment 6's
rate was the producer's projection from 10.6 decades/m
(4e5 x 10^(-10.6 x 0.25) = 895), not a measurement - n4a had not
run. Segment 6 at 10.60 and a projected n4a at 10.59 would have
agreed to 0.01 decades and looked like a striking confirmation of a
depth-constant rate, which is exactly what a circular check looks
like. The integrator's relay had not marked it as a projection.
Until n4a's measured count exists, the "n4a versus segment 6" check
has no reference value; when it arrives it is relayed as measured
records over 0.25 m, with no projection beside it.

## chain2 delivery, final state (SOURCE_TERM_DELIVERY.md, 324 lines, stamp chain2-2026-09-02T041642Z-stage0d6e9e64)

- Line 1: outermost face r = 4.735 m, T = 8.195e-13 (+/- 0.71, 2
  records), target <= 2.2e-10 - UNQUALIFIED (statistical starvation):
  T is below target but this face has only 2 records (< 18); chain at
  t = 0.50 m.
- Method gate PASS (1.03 +/- 0.08 / 1.00 +/- 0.19); statistical
  reading C (six dose-dominant groups with chain minimum < 18, all at
  segments 4 and 6); deep-region table at r = 4.735: 10.60 decades/m
  "> 6: suspect the chain first"; chain bracket through segment 6
  1.356x; segment 7 (0 exits) enters no table.
- Cost table, two corrections: the extension had written "step7" a
  second time and the last-stamp rule had given segment 7 9.3 min -
  now the first stamp per segment number is used (actual 4.4 min);
  segments with a source below 18 records (segment 7, source 2) are
  printed but marked "not in scatter"; with one remaining segment
  "no scatter to speak of" prints and no sigma.
- Sync 14/14 PASS, gates 212 PASS.

## Judgement on the band: a domain fault, on an axis the author never declared (sci-rad-01 289f151, before n4a-d)

Geometry is measured and insufficient: 10.6 / 1.631 = 6.50 decades
per metre of path against a band ceiling of 6; the trigger still
fires after a measured quantity has been removed, which is stronger
than before. The domain is the receiver's own: reading rule 1 says
"applies ONLY to ordinary or borated concrete at ~1% H and rho
2.3-2.4"; the producer's material at 0.97 wt% H and 2.35 g/cm3 is
inside it. A material domain was declared and a spectrum domain was
not, and attenuation rate depends on spectrum. The third quantity
this session specified on one of two axes: a_dose (energy x
moisture), decades/m (path vs slab), and now this band (material,
not spectrum).

The band is not widened: the producer's spectral argument is
reliable in direction but rests on cross sections from memory, for
magnitude only, and widening a pre-registered threshold after seeing
data is the loosening direction whatever the reason - handled as the
threshold pair was.

The discriminator is the depth curve, registered with numbers before
n4a-d exist, not only a direction:
  geometry alone -> rate constant with depth at 6.5 per metre of path
  spectrum-dependent removal -> the soft bulk exhausts first, the
    surviving spectrum hardens, the rate falls then plateaus; on a
    two-group model (soft 89% at 12-15, hard 11% at 5-6): cumulative
    8.6-9.8 at t = 0.25 -> 6.0-7.0 at t = 1.00, i.e. a 2-4 decades/m
    fall across n4a-d
  chain fault -> no predicted shape
If n4a-d come back flat, the spectral explanation fails too and the
chain-fault hypothesis is what remains standing.

The n4a loop is closed on the integrator's side (above): the ~900 was
a projection, n4a has not run, and its measured count is awaited
before the first point of the curve can be read. Option (i) stays
withdrawn; the receiver names no thickness for now.

Line 1's final state for this chain: NOT YET ANSWERABLE becomes
EXHAUSTED, NOT RESOLVED - cumulative T 8.2e-13 looks resolved and is
two records, starved, not citable. The chain did not answer the
question; it ran out, it did not finish.

Producer's three numbers, formally (numbers only): <mu> 0.7180 all /
0.7435 above 0.1 MeV; <1/mu> 1.7034 / 1.6309 (per-record average at
the entry face, excluding path growth from scattering in transit -
that belongs to the receiver's model); segment 6 slab rate 10.602 =
log10(400000/2)/0.5; per-path rate 10.602 / <1/mu> = 6.22 (all) /
6.50 (> 0.1 MeV); 1 sigma band on 2 counts (+/- 70.7%) on the slab
rate [10.14, 11.67], on the path rate [5.95, 6.85] (all) / [6.22,
7.15] (> 0.1 MeV). No records with mu < 0. Judgement left to the
receiver, including how the band ceiling of 6 relates to the two
values with their 1 sigma bands printed. The "about 900" is
withdrawn by the producer with the rule stated: a check's reference
may not be derived from the checked quantity. Cut-count s3a started
06:51:56Z.

The loop confirmed real (sci-rad-01 4039d05): had the check been
run as relayed, two depths would have agreed to 0.01 decades - a
striking confirmation produced entirely by the arithmetic that
generated one of the two numbers. General form: a projected number
quoted without its label becomes a measurement in the next reader's
hands; the number does not say which it is, only the label does,
and the label is what relaying drops. The same failure as
a_dose = 0.11, which was built on a sentence about a measurement,
one level deeper: a number derived from the thing under check,
relayed as if unrelated. How it was caught: not by suspecting
anyone, by one line of arithmetic - 895 is exactly the projection's
value. Rule: when a check agrees to a precision the measurement
cannot support, recompute the reference on the assumption that it
was derived from the thing under check; if it matches, that is the
explanation, not a coincidence. Handling: measured N over 0.25 m
relayed as is, no projection in the same column; a projection, if it
appears at all, carries the word "projection" and the rate it used.
When the measured n4a arrives, its first use is the comparison with
segment 6, which now has a reference.

Deep-region table re-cut on the receiver's denominator ruling
(gen_source_term.py): <1/mu> taken as the per-record average at the
entry face ss_{k-1}, excluding in-transit path growth; columns now
"face r | exits | attenuation x (+/- Poisson) | segment m | decades/m
(slab) | <1/mu> entry | decades/m (path) | verdict (path) |
cumulative T", with the header naming both denominators and applying
the band to the path value per the ruling. Row 4.735: 2 exits,
200000 +/- 141421, 0.50 m, 10.60 slab, 1.703, 6.22 path, "> 6:
suspect the chain first", 8.195e-13. The path value stays above the
ceiling of 6; the 1 sigma band on 2 counts, [5.95, 6.85], straddles
it; the verdict is printed by script from the registered band and
the reading (inside 2.5-6 => geometry explains fully; outside =>
residual is moderation plus capture) belongs to the receiver. n4a-d
will fill this column with four better-populated values. Gates 212
green; cut-count s3 set running.

## The band rule needed five specifications and had two (sci-rad-01 96deb29, before n4a-d)

  all records, point estimate      6.22   fires
  all records, 1 sigma lower       5.95   does not   <- the flip
  > 0.1 MeV, point estimate        6.50   fires
  > 0.1 MeV, 1 sigma lower         6.22   fires
Whether the receiver's own trigger fires now depends on two choices
made after seeing the data - exactly what pre-registration exists to
remove, and this one did not, because it was under-specified:
material domain given; spectrum domain missing; path versus slab
denominator missing; which record subset missing; point versus
interval missing.

Judgement, and it is not "depends": the rule's natural referent is
the segment's own attenuation, i.e. all records, and it was written
as a point comparison. 6.22 > 6: it fires. Using the 1 sigma lower
edge to release it would be widening a pre-registered threshold
after seeing data - the loosening direction, third time today. And
"fires" is the correct output here, not a false positive: "suspect"
means "go and check", and two counts is precisely the state to
check. A rule that fires when data are insufficient is working.

The honest headline is neither alone: a verdict that flips on the
choice of subset and on a +/-70% band is not a verdict about
physics; and the rule fired as written. Both are true and both must
be said - saying only the second claims a finding, saying only the
first quietly retires a trigger.

Specified now, before n4a-d: all records; point estimate; converted
to per metre of path with each slab's own <1/mu>; the 1 sigma band
printed beside the point estimate and never used to move the
verdict.

Named property: the depth-curve discriminator is immune to this
ambiguity. It measures shape (falling versus flat); a constant path
factor divides every depth's rate by the same number and leaves the
shape unchanged, and a subset chosen consistently across depths does
the same. The test registered before the ambiguity appeared is the
one the ambiguity cannot reach - luck, not foresight, and saying
which is the difference between a record and an advertisement.

Line-1 wording: "unqualified (statistical starvation)" is correct
and "exhausted" says one more thing - the chain did not answer, it
stopped.

Delivery line 1 regenerated in the aligned wording: "... target
<= 2.2e-10 - EXHAUSTED, NOT RESOLVED (chain exhausted, not answered):
T is below target but this face has only 2 records (< 18), starved,
not citable; >= 18 records needed to count as resolved (chain at
t = 0.50 m)".

## Cut-count test, measured sub-segments (numbers only, as they arrive)

- s3a: WC-B4C 0.04 m, zone LiPb 0.30, 06:57:00Z, out 119,388 /
  400,000, a = 0.0644.

The verdict rule is implemented once and imported: the cut-count
analysis imports dpm_verdict from the generator rather than copying
it, so the band and its label exist in one place. Delivery deep-
region columns now "... | decades/m (path) point | path 1 sigma band
| verdict (path point) | ...", header citing the 96deb29 rule (all-
record <1/mu>, point estimate, per-slab path conversion; 1 sigma
beside, not in the verdict). Segment-6 row: 10.60 | 1.703 | 6.22 |
[5.86, 6.58] | "> 6: suspect the chain first". The n4a-d rows use the
same format, checked on the n = 2 (segment 6) row. One difference of
convention stated by the producer: the printed 1 sigma band is the
script's symmetric propagation (Poisson 1/sqrt(N) through log10,
divided by thickness and <1/mu>) = [5.86, 6.58]; its earlier hand
value [5.95, 6.85] was the asymmetric T x (1 +/- 0.707) form. Both
are approximations at two counts; the printed one governs, and
neither enters the verdict.

## The checklist run against four pre-registrations due within the hour: three findings (sci-rad-01 86cace9)

1. The depth-curve discriminator cannot run on n4a-d. At the measured
   slab rate and 4e5 launches: t = 0.25 -> 894 records (usable);
   0.50 -> 2 (starved, as segment 6 already showed); 0.75 -> 0.004;
   1.00 -> 1e-5 (empty). One usable point; one point makes no curve.
   The discriminator was registered without checking that its own
   points could survive the attenuation it was meant to measure -
   the same defect that exhausted the chain, committed two hours
   after watching it happen to someone else.
   A set that works, same slab, same source, no new physics, and
   meeting the integrator's threshold (thicknesses n4a-d lack, and
   what they answer that n4a-d cannot): t = 0.10 (34,823 records
   expected, 0.5%), 0.20 (3,032, 1.8%), 0.30 (264, 6.2%), 0.40 (23,
   20.9%); >= 18 records requires t <= 0.410 m. It still
   discriminates: the two-group model predicts 12.5 -> 8.4 decades/m
   from 0.10 to 0.40, geometry alone predicts flat at 10.6. n4a-d
   cannot answer because three of its four points are empty.
   Ruling: approved - run_probe.sh at 0.10 / 0.20 / 0.30 / 0.40 m
   from ss_5 with the 0.06 m steel zone, 400k each, ordering the
   producer's, products to probe_<t>/, one name one stamp, measured
   N over thickness only (the expected counts above are the
   receiver's predictions, not the producer's reference), verdict
   columns on the same rule.
2. Prediction 2 is void, not pending. It concerned segments 7-10's
   concrete-zone albedo; the chain exhausted at segment 6, those
   segments do not and will not exist. A prediction whose data
   cannot exist is neither confirmed nor refuted; leaving it
   "pending" would let it later be matched quietly to some other
   segment that happened to fit.
3. Two of the three withdrawal-rule checks cannot run: check 1
   (spectral equilibrium) needs >= 3 concrete faces and check 3
   (rate stability) needs >= 3 concrete segments; there is one.
   "The withdrawal rules did not trigger" is false comfort - they did
   not run. NOT EVALUABLE is not PASSED. On this chain only check 2
   (A/B recording consistency) actually ran. The delivery's limits
   section is to say so. With the four probe points check 3 can be
   re-run.

What the checklist is worth: built from one rule's defect, applied
to four others, it found one void prediction, two checks that cannot
run, and one discriminator that cannot measure - none of which any
gate in the repository could catch, and all of which would have
surfaced as confusion the moment data arrived.

Probes launched: run_probes_all.sh (hash 7f9b906dceea6109) calls
run_probe.sh (062e685bc30e7365) in sequence at 0.10 -> 0.20 -> 0.30
-> 0.40 m, 400k each, from ss_5 with the 0.06 m steel zone identical
to segment 6; PIDs 18942 (overall) / 18944 (waiter for 0.10); starts
automatically after CUT-TEST-DONE, one after another, products to
probe_<t>/ with one name and stamp; watcher hung; each reported as
measured N over thickness only, verdict column on the same rule,
1 sigma beside. Delivery limits amended: checks 1 and 3 NOT
EVALUABLE, not passed, on this chain; only check 2 ran; check 3
re-runnable on the four probe points; prediction 2 void.

- s3b: WC-B4C 0.04 m, zone shield 0.04, 07:00:35Z, out 91,216 /
  400,000, a = 0.0802.

## The discriminator's sign corrected from data, before the probes exist (sci-rad-01 742b384)

s3a read against the single-cut segment 1 (same source, same zone):
s3a 0.04 m, T 0.29847 -> cumulative 13.13 decades/m; seg1 0.12 m,
T 0.01287 -> cumulative 15.75; the increment over 0.04-0.12 m is
17.07 decades/m. The rate rises with depth, 13.1 -> 17.1, it does
not fall. That breaks the registered sign: "geometry => flat;
moderation plus capture => falling" assumed the soft component is
exhausted first and the surviving spectrum hardens. But WC-B4C and
this borated concrete are strong 1/v absorbers: moderation delivers
neutrons into the absorber's strong region, so the rate rises - and
WC-B4C has just shown it.

Corrected, before the 0.10-0.40 probes exist:
  geometry alone -> flat
  spectrum-dependent removal -> not flat, with the sign carrying the
    mechanism: rising = moderation into an absorber; falling = the
    fastest-dying soft component exhausted
The discriminator weakens from three-way to flat / not flat, which is
its honest form. The receiver gave a sign it had no basis to give;
this correction came from data, not from thinking more clearly, and
that must be said or it reads as foresight.

Statistical note under the receiver's own ledger-7 rule: s3a launched
400,000 from a source of 23,247 records; resampling creates no
information, so N_eff <= 23,247 and T's relative error is at best
~1.2%, not 1/sqrt(119388) = 0.29%. Not binding here, but it will
bind on deeper sub-segments. Request to the producer: print the
source record count beside the launch count in every sub-segment
row, or errors will be under-reported by launch count.

The probe set was approved and launched before this message arrived;
the depth curve stays open.

## Probe reading format fixed before the probes arrive (producer; format only, no projection)

New delivery section "probe slab (independent run family, not chain
segments; one segment each from the t = 0 face, source and zone as
segment 6)": both driver sha256 values and the entry-face <1/mu>;
one row per thickness - t | start stamp | launched | exits N |
T_probe | cumulative T(t) = T(4.235) x T_probe | a | decades/m
(slab) +/- 1 sigma | decades/m (path) point | 1 sigma band | verdict
| status against 2.2e-10 - with three status branches: reached with
>= 18 records / reached with < 18 (starved) / not reached; zero-exit
rows print the 3/N one-sided bound. Fixed sentence at the end: a
probe face "reached" does not change line 1 - line 1 asks about the
chain's outermost concrete face; probes are another run family,
listed beside it under their own name; check 3 may be re-run on the
four probe points. analyse_probes.py prints the four points on the
same rule (slab / path / 1 sigma / verdict / duration / a) and the
incremental slab rate between adjacent thicknesses; the discriminator
is the receiver's, the producer only prints. Format checked on a
synthetic probe directory (segment-6 log standing in for a 0.50 m
row, numbers for format only). Sync 15/15, gates 213 green. The
source-record-count column requested above is to be added to these
rows as well.

## s3b confirms the sign twice over, and the resampling cap bites for the first time (sci-rad-01 219d83b)

s3a 0.00-0.04 m: T 0.29847, 13.13 decades/m; s3b 0.04-0.08 m:
T 0.22804, 16.05; implied 0.08-0.12: ~18.1 (that cell mixes 3-cut
and 1-cut runs and is replaced by a clean value when s3c arrives).
Monotonically rising: moderation into a 1/v absorber raises the
rate; the registered "falling" was wrong in sign and the data said
so twice within four minutes.

The resampling cap tightens segment by segment - the receiver's own
ledger-7 rule, costing something for the first time today: s3a
launched 400,000 from 23,247 records, N_eff <= 23,247; s3b launched
400,000 from 119,388 records whose own N_eff is <= 23,247, so still
<= 23,247. On s3b's 91,216 exits the relative error is 0.33% raw,
>= 0.66% capped by source, and 2.51% if limited by survival (N_eff
~1,582). Which of the three is right cannot be read from the
reported counts; it needs the multiplicity distribution - exactly
ledger 7's request_to_source_provider, made weeks ago and never
supplied. A limit declared and left declared, causing its first cost
today; invisible while every count was large.

It bites a registered number: the cut-count b resolution was
registered as sqrt(2/N) at N ~ 1e4 -> b to 0.93%, ten-join bound
1.10x; at N_eff 23,247 (source-capped) b to 0.61%, 1.06x; at N_eff
1,582 (survival-limited) b to 2.32%, 1.26x. A 2.5x spread on the
one quantity the cut-count test exists to measure, and it is not
statistics but not knowing which N to use; the registration assumed
launches carry information, and they do not. Request to the
producer, with the consumer named: per-sub-segment multiplicity
distribution (exits per parent source record) and Kish
N_eff = (sum n_i)^2 / sum n_i^2, if exit records carry or can
recover the parent index; otherwise a next-compile item, with the
cut-count ratio-table header stating "N_eff unknown; error by
min(source, exits) is a lower bound".

Correction to the integrator's "min(source, exits)": the cap
propagates, it is not recomputed per level. N_eff at level k is at
most the minimum over all j <= k of the level-j source record
count; on this chain that is 23,247 throughout. The integrator's
rule would give s3b 91,216 - loose by 3.9x, and looser at every
further level. Stated in the other direction without overreach: each
resampled particle is transported with fresh random numbers, so its
descendants differ; there is new information in the transport, only
not in the sampling of the incident flux. Source sampling
~1/sqrt(23,247) = 0.66%, transport ~1/sqrt(400,000) = 0.16%, in
quadrature 0.67%: the source term dominates, so the cap is the right
bound on the source-sampling component, and "resampling adds
nothing" is more than can be claimed. Print per sub-segment: (1)
this level's source records, (2) launched, (3) exits, (4) the
upstream-propagated minimum; report errors by (4), with (2) and (3)
as information columns, so which N to use is no longer decided by
whoever reads the table. The multiplicity request stands as the only
thing that closes the 2.5x.

Kish N_eff on the right quantity (sci-rad-01, ledger 7 lines
369-376 already separated the two mechanisms): applied to particle
weights on an analog chain with w = 1 the formula equals N and
reports a reduction of 1.0 - a plausible-looking number that
measures nothing, the shape of an impossible-to-fail check. It must
be applied to multiplicities: m_i = the number of times parent
record i was drawn, N_eff = (sum m_i)^2 / sum m_i^2 with
sum m_i = launches; uniform sampling gives m_i ~ 17.2 and
N_eff -> 23,247 (the propagated cap), non-uniform sampling gives
clearly less - which is what the 2.5x ambiguity is about. The
parent-index check remains the first step, and what it needs is the
histogram of draws per parent, not weights. Header wording when
unknown: "N_eff unknown; error reported by the upstream-propagated
minimum, itself still a lower bound".

## WC-B4C slab complete: first cut-count ratio (numbers only; reading is the receiver's)

| sub | thickness | zone | source | launched | exits | a |
|---|---|---|---|---|---|---|
| s3a | 0.04 | LiPb 0.30 | 23,247 | 400,000 | 119,388 | 0.0644 |
| s3b | 0.04 | shield 0.04 | 119,388 | 400,000 | 91,216 | 0.0802 |
| s3c | 0.04 | shield 0.04 | 91,216 | 400,000 | 83,299 | 0.0711 |
| n=1 (chain2 seg 1) | 0.12 | LiPb 0.30 | 23,247 | 400,000 | 5,149 | 0.0674 |

T(3 cuts, zone 0.04) = 1.4174e-2 (producer's 0.8% by min(source,
exits) - to be re-stated on the propagated minimum); T(1) =
1.2873e-2 (1.4%). T(3@0.04)/T(1) = 1.1011 +/- 0.0178 at dn = 2, the
zone factor f not removed, so it solves to "joint bias + zone
effect" and is labelled so; the t3 set (zone 0.08) isolates f next.
The producer had implemented N_eff = min(source, exits) per row and
a per-face "N_eff upper bound = chain minimum record count including
stage one" line (main face 1238 -> 0.028; r = 4.735 face 2 ->
0.707); the row rule is to be switched to the propagated minimum.
Gates 213 green.

Per-sub-segment rates, script-printed with both denominators (error
still by min(source, exits) at this print; propagated minimum to
follow):

| row | thickness | source | exits | decades/m (slab) | <1/mu> entry | decades/m (path) |
|---|---|---|---|---|---|---|
| n=1 (chain2 seg 1) | 0.12 | 23,247 | 5,149 | 15.75 +/- 0.05 | 1.687 | 9.34 |
| s3a | 0.04 | 23,247 | 119,388 | 13.13 +/- 0.07 | 1.687 | 7.78 |
| s3b | 0.04 | 119,388 | 91,216 | 16.05 +/- 0.04 | 1.678 | 9.56 |
| s3c | 0.04 | 91,216 | 83,299 | 17.04 +/- 0.04 | 1.671 | 10.19 |

Matches the receiver's own 13.1 -> 17.1; the sign (rising) is the
receiver's to read; the band label is not applied here (it is the
concrete band). Producer's self-catch, the "compared against the
wrong artefact" family: both slabs carry a label "1", and the rate
rows had inferred the source file from the label, wiring the WC-B4C
n=1 row to the concrete slab's ss_5 - printing source 218,898 and
<1/mu> 1.703, both wrong (23,247 / 1.687). Fixed by passing the
source file explicitly; the table above is post-fix. No earlier
WC-B4C figure sent used those two quantities (ratios and a do not
pass through that path), so nothing is withdrawn.

## The first ratio read: the registered asymmetry holds verbatim, and it dismantles the receiver's own bracket (sci-rad-01 101bc06)

Three sub-segment rates 13.13 / 16.05 / 17.04: rising and
decelerating toward a plateau - the saturation the "moderation into
an absorber" reading predicts; third confirmation, this time a
three-point curve.

Ratio T(3 cuts, zone 0.04) / T(1 cut, zone 0.30) = 1.4174e-2 /
1.2873e-2 = 1.1011 +/- 0.0178, 5.7 sigma from 1. The asymmetry
registered before any data applies as written: a ratio far from 1
is attributable to neither side, uninformative rather than adverse,
and explicitly not evidence of leaking joints. No amendment needed.

Decomposition against the measured albedos, which is a surprise that
falls on the receiver: albedo loss alone at the two extra joins
(a = 0.0802 and 0.0711) predicts a ratio of 0.8544; measured 1.1011;
so the zone / re-representation term is 1.2887, i.e. +29%. The zone
term is larger than the albedo term and of opposite sign. The
receiver's bracket held only one of the two per-join effects: it
treated albedo loss as the only per-join effect and bounded T from
below, while a second per-join effect raises T and is larger. So it
is not a bracket - with a second mechanism pushing the other way,
T_true is not confined to [T_meas, T_meas x prod 1/(1-a)]. Mechanism
as hypothesis, not conclusion: a thin zone (0.04 m) gives the
recorded distribution less room to re-equilibrate; if that
distribution is more forward than the true local one, transmission
is overestimated. The t3 set (zone 0.08) isolates exactly this term.

Direction check, because it decides whether this is safe: segment
6's zone is steel 0.06 m - thin. If a thin zone raises T, the chain's
reported escape is too high and the shield looks worse than it is -
the conservative direction, opposite to the albedo loss. Two per-join
effects of opposite sign, neither negligible. Until t3 isolates f,
the uncertainty on the deep number is not "a lower bound and an
upper bound" but "two unseparated terms of opposite sign".

Awaited: t3 (isolates f), the four probes (flat / not flat), the
multiplicity distribution (closes the 2.5x N_eff ambiguity).

## Urgent self-correction: dividing by <1/mu> is a thin-slab operation and segment 6 is not thin (sci-rad-01 c1f82ea)

T(t) = integral of f(mu) exp(-Sigma t / mu) d mu. For large Sigma t
the integrand peaks at mu = 1: transmission is carried by the least-
deflected neutrons, and -log10(T)/t tends to the normal-incidence
rate; the effective 1/mu tends to 1, not to the entry-face average.
Segment 6 is 20-23 mean free paths. The data had already said so in
a line the receiver itself had quoted: the two exits have u_r 0.99
and 0.98, i.e. 1/mu = 1.010 and 1.020, against an entry mean of
1.631. The transmitted population is not the incident population,
and the average was taken over the wrong one. Those two cosines were
in hand when the correction was written; they were used to argue
"grazing is plausible" and never noticed as a direct measurement of
the very correction being applied - which they contradict.

  10.602 / 1.631 = 6.50 decades per metre of path (used)
  10.602 / 1.015 = 10.45 decades per metre of path (exit-weighted)

The trigger does not fire marginally; it fires harder.

Separating the right half from the wrong half: "the band and the
number are not in the same unit" - true, and it stands as a real
defect of the reading rule. "The correction is a factor of 1.6" -
false: a formula applied outside its domain, decisively, and
"domain" is what the receiver had spent the morning asking everyone
for. The explanation left standing is the producer's, not the
receiver's: the band is a hard-spectrum band; segment 6's incident
spectrum is soft (76% below 27.5 keV); the producer's hand estimate
gives 11-12 decades/m for 0.1-0.4 MeV neutrons in this concrete; the
measured 10.6 per metre of slab, with the correction near 1, is
~10.6 per metre of path - inside that estimate. The receiver had
added a geometric factor that does not exist at this depth.

Handling: the limits column's "<1/mu> conversion to path" applies
only to thin segments; deep segments are reported per slab thickness
with the note "under deep penetration the two coincide". The
producer's boundary - "excluding in-transit path growth, that
belongs to your model" - was drawn correctly; the receiver's model
used the wrong limit. On the label collision: "a label is not an
identity"; the receiver verified from its side that the ratios use
only T and do not pass through the <1/mu> lookup, confirming that
nothing needs withdrawal.

## Multiplicity answered from source; the propagated minimum lands, and for everything beyond t = 0 it is 1,238

Sampling (stage.cc:276): uniform with replacement, each history
drawing one source record independently. Exit records carry no
parent index (fields E, u_r, u_z, z only; stage.cc:442) and the log
does not record it, so multiplicity cannot be recovered: the
histogram and Kish N_eff go on the next-compile list (a parent-index
column in the records), alongside seed, progress line and energy
splitting. Analytic approximation offered, labelled as such: uniform
with replacement gives m_i ~ Poisson(N/S), so Kish N_eff ~
N S / (N + S) - s3a (S = 23,247, N = 400k) ~ 21,970; s3b
(S = 119,388) ~ 91,950. An approximation to sampling uniformity, not
an implemented value; under uniform sampling the "non-uniform =>
clearly lower" case cannot arise, but unprinted m_i do not count as
measured.

Propagated minimum in three places (cut-count rows, probe rows,
chain rows: "this level's source / launched / exits / upstream
propagated min", error by min(propagated min, this level's exits),
header "N_eff unknown; this value is a lower bound"), read from the
chain2 source files: WC-B4C slab (source ss_0) 23,247; concrete slab
and probes (source ss_5) 1,238 - segment 4's exit count, the chain
minimum, propagated to everything beyond the t = 0 face. Every probe
point therefore carries a relative-error floor of 1/sqrt(1238) =
2.8% regardless of its exit count, and the flat / not-flat reading
of the depth curve is to be made against that floor. Ratio updated:
T(3@0.04)/T(1) = 1.1011 +/- 0.0198 (was +/- 0.0178).

- t3a: WC-B4C 0.04 m, zone LiPb 0.30, 07:08:46Z, out 119,388 /
  400,000, a = 0.0644 - same command as s3a, identical numbers;
  bit-level sha256 check printed by script in the next message.
  Confirmed: ss_s3a.txt and ss_t3a.txt are bit-identical (same seed,
  input and command). The first sub-segment cancels exactly in the
  dn = 0 ratio T(3@0.08)/T(3@0.04), leaving only the two-segment
  difference between 0.08 and 0.04 m zones; the ratio's error,
  combined over four segments, is conservative (the first
  sub-segment's 1/N counted twice), left as is and annotated. The
  first data confirmation of "no seed entry => same command, same
  result", previously an expectation read from source.

## The secant withdrawal written into the ledger, with its direction, and a second reason that matters more for the probes (sci-rad-01 eb29410)

The correction had been sent in a message while the ledger still
said the old thing in four places - the prose-versus-callable shape
again; now changed in the files. Because a registered specification
is being altered after data, its direction is named: the old text
"per metre of path, using each slab's own <1/mu>" is withdrawn and
replaced by "per metre of slab thickness, no path correction". Not
dividing makes segment 6 read 10.45 rather than 6.50 - further from
the band. The change tightens; it does not loosen. A post-data
change must state its direction or it is indistinguishable from
selection.

The second reason, seen only while fixing the first: the path
correction varies with depth (near 1 deep, above 1 shallow), and the
probes at 0.10-0.40 m span roughly 4-18 mean free paths, exactly the
thin-to-deep transition. Applying a depth-varying correction to a
test whose entire signal is a depth trend fabricates the very shape
being measured: a 1.63 -> 1.00 correction across 0.10 -> 0.40 m is
by itself a 63% spurious rise, which is the opposite sign of the
two-group model's predicted fall - it would not merely add noise, it
could reverse the conclusion. So all four probe points are reported
per metre of slab thickness with no path correction at all. This
reason outranks the first.

The relabelled column ("albedo single-term bound (information; second
term, zone effect, opposite sign, unseparated)") is accepted: a
column called "upper bound" is not one while a second term of
opposite sign is unseparated.

Producer's implementation (delivery 342 lines, stamp unchanged, no
number changed): the chain table's last column relabelled "albedo
single-term bound (information; second term, zone effect, opposite
sign, unseparated - see cut-count t3)"; the bracket sentence under
the table withdrawn and replaced by the decomposition (albedo-only
0.8544, measured 1.1011, zone term 1.2887, larger and opposite,
unseparated; information, not correction; load-bearing column
unchanged); a limits paragraph on segment 6's thin steel zone and
its conservative direction, printed as direction only. Deep-region
table: the urgent correction sentence added (thin-slab concept;
segment 6 at 20-23 mfp, transmission carried by the least-deflected,
effective <1/mu> -> 1, exits u_r 0.993 / 0.975); deep segments
reported per slab; path column marked "thin-slab concept; deep
segments converge to the slab value". The producer's note that the
verdict column awaited the receiver's rewrite crossed with that
rewrite's arrival; the verdict column is to move to the slab point
estimate now, with path and <1/mu> as information columns, for
segment 6 and all probe rows alike. Gates 219 green.

## 1,238 is the bottleneck of the whole deep result, not of two groups (sci-rad-01 00183f6)

Segment 4 exited 1,238 records; segment 5 launched 400k from them
and exited 218,898; so every record in ss_5, and every number beyond
r = 3.575, derives from 1,238 independent histories. The floor on
any relative error past segment 4 is 1/sqrt(1238) = 2.84%. Segment 4
had been identified as the g16/g17 bottleneck; it is the bottleneck
of the entire deep result. No downstream count is worth more than
1,238; the main face's 218,898 is a record count, not a history
count.

The probe power calculation redone under that cap: t = 0.10 and 0.20
at 2.84% (cap-limited, +/- 0.123 and 0.062 decades/m), t = 0.30 at
6.16% (+/- 0.089, count-limited), t = 0.40 at 20.86% (+/- 0.227,
count-limited); trend noise 0.258 against a signal of 4.15: 16.1
sigma (18.2 before the cap). Still decisive - the second time the
"check your own proposal's points" lesson was applied to the
receiver's own proposal, and this time the answer was "no change",
which counts only because it was checked.

Correction of the receiver's own hedge: it had written that N_eff
could be as low as ~1,582 if sampling were non-uniform and called
the spread a 2.5x ambiguity. The producer read the source:
stage.cc:276 samples uniformly with replacement, so multiplicities
are Poisson and Kish has the closed form N S / (N + S) - s3a 21,970,
probes 1,234. The 2.5x ambiguity was the receiver's: a hedge against
a non-uniformity the sampler itself excludes, priced without
checking whether it could occur; the producer checked the source,
the receiver checked nothing and priced the doubt. What remains is
narrower and real: m_i is not recorded, so the value is derived from
an assumption about the sampler, not measured; the parent-index
column at the next compile is the right placement.

The only repair is measured in hours and downstream launches buy
nothing: N_eff ~ 5,000 needs segment 4 at x4.0 (3.9 h); ~10,000
needs x8.1 (7.7 h). The "where is the minimum" discipline applied to
the whole result says the deep number's precision was fixed before
the concrete was touched. Ruling deferred to the integrator; the
receiver's advice: do not buy 3.9 h of precision for a number that
has no citable verdict yet; read t3 and the four probes first, and
return to it only if a conclusion is stuck on 2.84%.

Integrator's ruling: the segment-4 enlargement does not run now,
per the receiver's advice; the delivery's limits gain "the main
face's 218,898 is a record count, not a history count; segment 4's
1,238 is the chain's independent-history cap and every downstream
relative error is >= 2.84%", and the to-do list gains the x4 / x8
option with its trigger "a verdict stuck on the 2.84% floor". The
receiver's own 1,582 hedge is withdrawn; the producer's closed-form
Kish (probes 1,234) is kept, labelled "derived from a sampler
assumption, not measured".

eb29410 implemented in three places (delivery deep-region and probe
tables, cut-count analysis, probe analysis): the verdict on the slab
point estimate, the 1 sigma band on the slab value, <1/mu> and the
path value as information columns outside the verdict, both reasons
quoted in the headers. Segment-6 row: 10.60 | [9.99, 11.22] |
"> 6: suspect the chain first" | info: <1/mu> 1.703, path 6.22. No
number changed, only the verdict's denominator.

- t3b: WC-B4C 0.04 m, zone shield 0.08, 07:12:28Z, out 91,593 /
  400,000, a = 0.0117. Same position with zone 0.04 (s3b): 91,216,
  a 0.0802. Numbers only; the dn = 0 ratio prints when t3c lands.

## Why "hedging without checking" survives where other failures do not (sci-rad-01 37634cc)

A hedge looks like caution. "If sampling were non-uniform, N_eff
could be as low as ~1,582" reads as care: it widens the interval,
admits a doubt, and costs its author nothing to be seen saying. A
bold claim invites scrutiny; a hedge invites agreement. So "is this
doubt real" is never asked - the reader does not ask because the
hedge is on their side, the writer does not ask because it already
feels like the careful thing. The concrete cost: a 2.5x price on the
one quantity the cut-count test exists to measure, on the basis of a
mechanism the sampler itself excludes; the producer read
stage.cc:276, the receiver read nothing and published the doubt.

Worse than an overstatement, for an asymmetric reason: an overstated
claim is corrected by the first person who checks it; an over-wide
hedge is corrected by no one, because being wrong in the conservative
direction is not experienced as being wrong. It stays in the
interval, widens every downstream bound a little, and everyone who
passes it on is doing their job correctly. An unfounded hedge
travels further than an unfounded claim, and it travels dressed as
caution.

The rule that catches it: a doubt is a claim. Before pricing it, name
the mechanism that would produce it and check whether that mechanism
can occur. If it cannot, the hedge is not conservatism but a
manufactured uncertainty, paid for by whoever acts on it. The same
shape as "name a real event that would make this check fire",
pointed at an interval instead of a check.

Delivery limits now carry, with the numbers computed by script from
the chain files: "the main face's 218898 are record counts, not
history counts: all derive by resampling from segment 4's 1238
independent histories; 1238 is the chain's independent-history cap,
and every relative error beyond r = 3.575 is >= 1/sqrt(1238) = 2.84%
regardless of exit count; the only repair is more launches at
segment 4, downstream launches do not move this floor (closed-form
Kish for the probes N S / (N + S) ~ 1234, derived from a sampler
assumption, not measured)". To-do list: segment 4 at x4 (3.9 h) /
x8 (7.7 h) as an option, not run now, trigger "a verdict stuck on
the 2.84% floor"; the receiver's 1,582 withdrawal noted. Gates 219
green.

## t3b: the albedo-to-transmission coupling is bounded, not measured, and the bracket collapses to 1.30x (sci-rad-01 17b1c3e)

Zone 0.04 -> 0.08 m at the same position: a 0.0802 -> 0.0117 (down
6.9x); T 0.22804 -> 0.22898 (+0.41%). Is the +0.41% real? No: the
slab's N_eff is capped at 23,247, single-run relative error 0.66%,
difference 0.93%, so +0.41% is 0.45 sigma, consistent with zero. The
coupling from recovered albedo (0.0685) to recovered transmission
(+0.41%) is therefore bounded, not measured: point estimate 6.0%,
95% one-sided upper bound 28.3%. Killing a returning albedo particle
costs far less than a transmitted neutron. The earlier argument
"the loss in T is strictly less than a" was right and said nothing
about the size - about 6% of a, at most ~29% - and the size is the
bracket's entire content.

The bracket collapses, and this is a measured tightening, not an
assumption: at a = 0.0921 over ten joins, 100% coupling (as
registered) gave 2.63x; 28.3% coupling (95% bound) gives 1.30x; 6.0%
(point) gives 1.06x. Governing value 1.30x, the 95% bound - a point
estimate consistent with zero is not carried as an answer.

It also deflates a number the receiver had derived: the 3-cut / 1-cut
decomposition assumed 100% coupling and gave "zone term +29%"; at the
measured coupling bound the albedo part predicts 0.9576 rather than
0.8544, so the residual is +15%, not +29%. The receiver had inflated
its own zone term by a factor of two using a coupling it had argued
in the same document was below one.

Limit on the same line: one slab, one material (WC-B4C), one depth,
one pair of zone thicknesses. The coupling may differ in concrete
and at other depths; t3c and the concrete n4 pair measure whether it
transfers.

Producer's print (chain table, two factor columns side by side,
judgement the receiver's):

| seg | face r | load-bearing cumulative T | prod (1-a_i)^(-c), c = 0.283 (governing) | albedo single-term bound (info) | prod 1/(1-a_i), c = 1 (registered, info) |
|---|---|---|---|---|---|
| 5 | 4.235 | 1.639e-7 | 1.052 | 1.725e-7 | 1.197 |
| 6 | 4.735 | 8.195e-13 | 1.090 | 8.932e-13 | 1.355 |

Sentence under the table as recorded: t3b against s3b, a 0.0802 ->
0.0117 (down 6.9x) with T +0.41% = 0.45 sigma, consistent with zero,
so the coupling is bounded not measured, point 6.0%, 95% one-sided
upper bound c = 0.283 (governing), c = 1 registered (information);
c measured on one WC-B4C slab at one depth, transfer to concrete
pending t3c / n4; the point estimate 0.06 is consistent with zero
and not carried as an answer. "Zone term +29%" changed to "+15%".
Gates 219 green.

Form corrected (sci-rad-01): the integrator's (1-a)^(-c) is
numerically fine (three candidate forms differ by 0.21% at a =
0.117; over ten joins 1.422 / 1.400 / 1.393) but encodes the wrong
model - it is a fractional power of the albedo survival and does not
follow from how c was measured. c was measured as a local
derivative, dT/T = -c da, which integrates to T = T0 exp(-c a), so
the correction consistent with the measurement's definition is
exp(c a); 1/(1 - c a) is first-order equivalent. The reader should
be able to recover the model from the form. The choice is
numerically unimportant for a reason worth printing: c's own span
(0.060 point to 0.283 bound, ten-join 1.073x to 1.393x) outweighs
the difference between forms by about 20x. So what belongs beside
the governing column is c's own bound, not the old c = 1 value: c = 1
is now known to be wrong (excluded by measurement, upper bound
0.283), not conservative, and printing it beside would present it as
another credible option. Final print: prod exp(c a_i) at c = 0.283
(governing, 95% upper bound), beside c = 0.060 (point, consistent
with zero, not an answer); header: c is the measured per-join
relative transmission-loss coefficient, one WC-B4C slab at one
depth; the c = 1 column is withdrawn because measurement excludes
it, not because it was conservative; using c = 0.283 at concrete
joins is extrapolation, not measurement, until t3c / n4.

## WC-B4C slab: all six sub-segments in; the zone factor isolated (numbers only, reading the receiver's)

| row | sub-segments (source / launched / exits) | T | rel. error (propagated min 23,247) |
|---|---|---|---|
| n=1 | 23,247 / 400k / 5,149 | 1.2873e-2 | 1.4% |
| n=3, zone 0.04 (s3) | 23,247/400k/119,388 . 119,388/400k/91,216 . 91,216/400k/83,299 | 1.4174e-2 | 1.1% |
| n=3, zone 0.08 (t3) | 23,247/400k/119,388 . 119,388/400k/91,593 . 91,593/400k/83,453 | 1.4259e-2 | 1.1% |

Ratios by the registered rules, script-computed:
- T(3@0.08) / T(3@0.04) = 1.0060 +/- 0.0162 (dn = 0; isolates the
  zone factor f at constant b)
- T(3@0.08) / T(1) = 1.1077 +/- 0.0199 (dn = 2; second zone thickness)
- T(3@0.04) / T(1) = 1.1011 +/- 0.0198 (dn = 2; zone factor not
  removed)

Per-sub-segment a: s3 = 0.0644 / 0.0802 / 0.0711; t3 = 0.0644 /
0.0117 / 0.0100 (doubling the zone cuts a by 6.9x / 7.1x while T
moves +0.41% / +0.18%). Slab rates: s3 13.13 / 16.05 / 17.04, t3
13.13 / 16.00 / 17.02 (1 sigma +/- 0.07). First sub-segments s3a /
t3a bit-identical by sha256. Concrete slab n1 (1.0 m) running from
07:16Z; n4a is the next populated point.

## 07:18Z watcher output, verbatim

  === 07:03Z sample 2026-09-02T07:03:01Z: SAMPLED cpu_s=148 pid=18862
  === 07:18Z fault-line reading 2026-09-02T07:18:00Z ===
  DEADLINE-OK: CHAIN-DONE was present before 07:18Z

The pid sampled at 07:03Z (18862) was the cut-count process running
at the time and has no bearing on the reading; CHAIN-DONE at
06:45:41Z took the first branch. Watcher stood down. The
exp(c a_i) columns (governing 0.283, point 0.060 beside, c = 1
withdrawn with the reason in the header) are being landed; numbers
follow.

Landed (chain table; c = 1 column withdrawn, reason under the
table):

| seg | face r | load-bearing cumulative T | prod exp(0.283 a_i) (governing, 95% one-sided bound) | albedo single-term bound (info) | prod exp(0.060 a_i) (point, consistent with zero) |
|---|---|---|---|---|---|
| 4 | 3.575 | 2.995e-7 | 1.047 | 3.136e-7 | 1.010 |
| 5 | 4.235 | 1.639e-7 | 1.050 | 1.721e-7 | 1.010 |
| 6 | 4.735 | 8.195e-13 | 1.085 | 8.895e-13 | 1.018 |

Sum of a through segment 6 = 0.2898. Sentence under the table: c is
the measured per-join relative transmission-loss coefficient (local
derivative dT/T = -c da, so the consistent factor is exp(c a), not
(1-a)^(-c)); measured on one WC-B4C slab at one depth; using c =
0.283 at concrete joins is extrapolation, not measurement, pending
t3c / n4; the c = 1 column is withdrawn because measurement excludes
it (upper bound 0.283), not because it was conservative. Gates 221
green. Concrete slab n1 running.

## The cut-count line delivers: "attributable to neither" becomes "attributable" (sci-rad-01 f617fd5)

  dn = 0 (isolates f)       1.0060 +/- 0.0162   0.37 sigma   consistent with 1
  dn = 2, zone 0.04         1.1011 +/- 0.0198   5.11 sigma
  dn = 2, zone 0.08         1.1077 +/- 0.0199   5.41 sigma

f is zero, and the 10% at dn = 2 does not change with zone
thickness. Together with the albedo set - a is strongly zone-driven
(down 6.9x / 7.1x) and barely moves T (coupling <= 28%) - the
per-join bias is neither albedo loss nor zone thickness. It is the
re-representation operation itself: recording the flux on a face and
relaunching from that record. Both named mechanisms were measured,
and neither is it.

Why the attribution is legitimate: the registered asymmetry ("a
ratio far from 1 is attributable to neither") also named the run
that would lift it - n = 3 at a second zone thickness, cuts
unchanged. That run happened, f came back zero, and the whole ratio
attributes to the joins. The registration did not merely record a
limitation; it specified the experiment that removes it - the
difference between a warning and a plan, and the reason today's
attribution is not after the fact.

b, the number this line exists for: zone 0.04, +4.93% +/- 0.90% per
join; zone 0.08, +5.25% +/- 0.90%. Sign: the chain over-reports T.
b was registered as a loss; it is a gain. The registered resolution
requirement was b > 0.93%; the effect is five times that - the test
had the power, and it returned a number. Over 5 joins (to the main
face) T over-reported by 1.28x; over 10 joins, 1.64x.

Not applied yet, and the reason is exactly what makes it tempting:
over-reported T means over-reported escape and a shield that looks
worse than it is, so correcting b improves the answer - precisely
the direction in which an unverified transfer must never be applied.
It was measured in WC-B4C at 0.04 m sub-segments; the chain's joins
are other materials and thicknesses. n4a-d measure whether it
transfers in concrete; until then b is a WC-B4C number.

Side results: s3a / t3a bit-identical (the dn = 0 pair's first
sub-segment cancels exactly, cleaner than assumed); slab rates agree
pairwise between s3 and t3 (13.13 / 16.0x / 17.0x), so zone
thickness does not affect the shape of the rate curve either - the
probes' flat / not-flat signal is not contaminated by the zone
choice.

Wording of the unapplied correction in the delivery limits, amended
on the receiver's point: a declared-but-unapplied correction must
carry its size on the same line - direction alone tells the reader
it is optimistic against them but not whether it is 1.03x or 3x,
which decides whether to stop. And the size carries the unverified-
transfer condition in the same sentence, since the condition is
what gets dropped in copying: "per-join re-representation bias b
(measured on WC-B4C 0.04 m sub-segments, +4.9% / +5.3% +/- 0.9% per
join, sign: gain) not applied to the load-bearing column. If that b
transfers to this chain's joins (concrete transfer pending n4a-d),
T at the main face r = 4.235 is over-reported by about 1.28x (5
joins) and at r = 4.735 by 1.64x (10 joins); applying it would make
the shield look better, so it is not applied before transfer is
verified." The "limits printed by the same call as the number" rule
applied to a correction rather than a limit: without its size an
unapplied correction reads as a footnote; with it, it is a quantity.

Producer's first landing of the sentence carried the size but
stated "1.28x / 1.64x" unconditionally, with "concrete transfer
pending n4a-d" in the following sentence - the exact split the
receiver had warned against. Asked to fold the condition into the
same clause: "if that b transfers to this chain's joins (concrete
transfer pending n4a-d), then T at r = 4.235 is over-reported by
about 1.28x (5 joins) and at r = 4.735 by 1.64x (10 joins)". n1
(1.0 m concrete, long histories) still running; n4a follows.

Folded and landed (delivery line 287, nothing else touched): the
measured b with its sign and its reading, "not applied to the load-
bearing column", then in one sentence "if that b transfers to this
chain's joins (concrete transfer pending n4a-d), then T at the main
face r = 4.235 is over-reported by about 1.28x (5 joins) and at
r = 4.735 by 1.64x (10 joins); applying it would make the shield look
better, so it is not applied before transfer is verified." Both
points present: the unapplied correction carries its size, and the
condition and the number share a sentence. Gates 221 green.

## Concrete slab, cut-count (numbers only)

- n1: borated concrete 1.00 m, zone steel 0.06, 07:25:22Z, out
  0 / 400,000, a = 0.1177. Zero-exit row printed by script: slab
  rate > 5.12 decades/m (3/N one-sided), no verdict. n4a (0.25 m)
  running from 07:25Z; SKIP rows printed as they occur.

Receiver's reading of n1 (sci-rad-01): a genuine confirmation and a
bound that reads like support and is not.

The confirmation: a is set by the zone, not by the segment's own
thickness, on two independent pairs. n1 concrete 1.00 m / seg6
concrete 0.50 m, both zone steel 0.06 from ss_5: a 0.1177 / 0.117,
0.6% apart. s3a WC-B4C 0.04 m / seg1 WC-B4C 0.12 m, both zone LiPb
0.30: a 0.0644 / 0.0674, 4.7% apart. Same zone, different segment
thickness, same a. If a were a property of the cut face it would
vary with segment thickness; it does not. "a is the zone's failure
rate", registered before either pair was compared, now has two
confirmations on two materials.

The non-discriminating bound: 0 of 400,000 over 1.00 m gives a rate
above 5.12 decades/m; the band ceiling is 6.0 and segment 6 measured
10.60. Since 5.12 is below the ceiling, the row is compatible with
both "in band" and "10.6" and constrains nothing - yet "> 5.12"
printed beside 10.60 reads like support for 10.6. An empty row's
bound is weak, and weak in the uninformative direction. The verdict
cell is to read "no verdict (bound 5.12 below the band ceiling;
compatible with both sides)" rather than "no verdict" alone - saying
why there is no verdict is harder to misquote than saying only that
there is none.

n1's zero at 1.00 m also confirms the calculation (t = 1.00 expected
1e-5 records) that led to the probe set; this row is what that set
was designed not to repeat four times. The transfer verdict remains
on n4a (0.25 m) and the four probes.

Zero-exit verdict cell implemented once (zero_out_verdict in the
generator, imported by the cut-count and probe analyses; the band
ceiling 6.0 read from the registered band table, not typed): n1 now
prints "out 0/400000  slab decades/m > 5.12 (3/N one-sided)  verdict:
no verdict (bound 5.12 below the band ceiling 6.0; compatible with
both sides)"; when the bound is at or above the ceiling it prints
"no verdict (bound X >= ceiling 6.0; compatible with outside the
band)". Gates 221 green. n4a running from 07:25Z.

- n4a: borated concrete 0.25 m, zone steel 0.06, source ss_5
  (218,898 records), 07:34:38Z, out 1,105 / 400,000, a = 0.1170.
  Script row (slab basis): decades/m (slab) 10.23, 1 sigma [10.18,
  10.29] (N_eff 1105 = min(propagated 1238, exits)); verdict (slab)
  "> 6: suspect the chain first"; info: <1/mu> entry 1.703. Against
  segment 6 (0.50 m): 10.60 [9.99, 11.22]. Measured, not projected:
  the earlier projection at 10.6 decades/m was 895 records; the
  measurement is 1,105. Shape of the depth curve is the receiver's
  to read. n4b (0.25 m, zone concrete 0.25, source = n4a's 1,105
  records) running.

## The concrete transfer test as queued has an empty denominator; re-planned before n4b lands (sci-rad-01 bcecdad)

Confirmed first: the projection was 23% off (895 projected at 10.6
decades/m, 1,105 measured; the measured 0-0.25 rate is 10.23 against
the 10.60 the projection used), and a circular check would have hid
exactly that - using 895 as the reference reproduces 10.60 by
construction and erases a real 3.5% rate difference. The loop was
not merely uninformative; it would have concealed the one thing the
comparison was for.

Two concrete points cannot yet decide flat versus rising: 0-0.25 at
10.23 +/- 0.05 (N_eff 1105), 0-0.50 at 10.60 +/- 0.61 (2 records),
difference +0.37 on a combined 0.61, 0.6 sigma. The four probes
decide, as registered.

The transfer test as queued cannot answer: a cut-count ratio needs
T(1 cut) and T(n cuts) at the same total thickness, and the only
single-cut concrete references are n1 (1.00 m, 0 records, ratio
undefined) and seg6 (0.50 m, 2 records, +/- 70%). n4a-d total 1.00 m,
whose natural reference is n1 with a zero denominator; those runs
would produce a ratio that is nothing. Another instance of a test
whose own reference does not survive the attenuation it measures -
this time in the queue rather than in the registration.

The configuration that works, at the cost of one n4a-sized run:
0.25 m cut into 5 x 0.05 m, referenced to n4a's single cut, about
1,105 records on each side; at b = +5% per join and dn = 4 the ratio
is 1.216 (+21.6%) on 4.3% noise, 5.1 sigma. Two cuts of 0.125 m would
give only 1.2 sigma: the discriminating variable is the number of
joins, not the thickness. This is the only queued or proposed
configuration that can answer whether b transfers to concrete.

Ruling: the remaining concrete cut-count rows are cancelled - n4b
allowed to finish only if nearly done, else killed by PID after
cmdline check; n4c, n4d and m4a-d cancelled (m4a would be
bit-identical to n4a; the rest are starved); CUT-TEST-DONE then
fires and the four probes run for the flat / not-flat reading; after
the probes, c5a-e: five 0.05 m sub-segments of borated concrete from
ss_5, first zone steel 0.06 as n4a, later zones the previous
sub-segment's 0.05 m of concrete (as in the WC-B4C set), 400k each,
printing measured N and T(5 cuts) / T(n4a) only. Had the queue been
kept, the n4 results would have been recorded as "ratio defined but
without discriminating power" and excluded from the transfer
verdict.

Zone for c5 fixed at 0.05 m, on a geometric reason, not a
statistical one (sci-rad-01): the zone is the re-representation
region upstream of a cut face, so a 0.10 m zone hung on the 0.10 m
face would reach back across the 0.05 m face and re-simulate
material whose incident distribution is itself a record - the effect
under test would be mixed with the join upstream of it. A zone
thicker than the sub-segment spacing crosses an upstream join and
changes what the ratio means, not its precision; 0.05 m reaches
exactly back to the previous face, touching without crossing - the
clean maximum. "Smaller is safer" is not the reason and would not
decide the choice. Statistically the choice costs almost nothing:
f measured zero on WC-B4C across 0.04 -> 0.08 and the albedo-to-T
coupling is <= 28%, so the zone barely moves T; by log-linear
interpolation a at 0.05 m is about 0.050, and a is diagnostic here,
not driving. Fixed: c5a-e five sub-segments of 0.05 m, the four
internal joins with 0.05 m concrete zones, the first zone steel 0.06
as n4a's, since both sides of the ratio must share source and first
zone.

Executed by the producer, with PIDs and collateral check: the cut-
count driver (PID 16274) verified by cmdline and killed by PID -
n4c, n4d and m4a-d will not start; n4b (stage PID 21063, from
07:34Z) kept to completion since it was already computing (about
9 min), its row printed; finish_cut.sh (PID 21369, hash 61055817...)
waits for n4b to exit, records its row marked "recorded by finish_cut
after driver cancellation", records the cancelled rows with reasons,
writes CUT-TEST-DONE, and the probes start; probe processes 18942 /
18944 unaffected; run_c5.sh (PID 21376, hash 80e518d4...) waits for
ALL-PROBES-DONE and then runs c5a-e as specified, empty input SKIP
not abort, printing measured N and T(5 cuts) / T(n4a) only. The
producer's own reason for 0.05 m (same rule as the WC-B4C set, zone
= sub-segment thickness; f = 0 so 0.05 and 0.10 are equivalent in T
and differ only in a, and 0.05 adds a point to a versus zone
thickness) is the statistical half; the geometric half above is the
deciding one, and they agree on 0.05. Watchers: c5 hung; the cut-
count watcher pushes n4b's row and CUT-TEST-DONE; the probe watcher
on station. Sync 15/15 with the two new scripts joining the
manifest; gates 222 green.

Confirmed: the deployed run_c5.sh already matches the 0.05 m zone
(c5a zone steel 0.06 as n4a; c5b-e zones concrete 0.05; 400k each;
after ALL-PROBES-DONE), no change needed; the geometric reason is
recorded in the script's comments and the to-do list. Sync manifest
now 17/17 PASS with the two new scripts (the earlier count was 15,
not 14). Gates 222 green.

- n4b (recorded by finish_cut.sh in the driver's format, marked as
  such): concrete 0.25 m, zone concrete 0.25, source 1,105 records,
  out 298 / 400,000, a = 1.1e-4. Script row: slab rate 12.51, 1 sigma
  [12.41, 12.61] (N_eff 298), verdict > 6. Cancelled rows (n4c, n4d,
  m4a-d) recorded with reasons. CUT-TEST-DONE 07:40:33Z; probe
  0.10 m running from 07:40Z (stage PID 22176). Numbers only: with
  n4a this gives a second concrete depth interval, 0-0.25 at 10.23
  and 0.25-0.50 at 12.51; the receiver reads the shape. The 0.25 m
  zone here equals the sub-segment spacing (touches the previous
  face, does not cross it).

Producer's self-catch, recorded: after writing the zone reason into
run_c5.sh's comments it redeployed the file to the VM while the
waiting bash (PID 21376) was executing it. bash continues a script
by byte offset, so inserting text before the loop would have made
the old process resume at a shifted offset when its wait ended -
untrustworthy behaviour. Caught, old instance killed by PID after a
cmdline check, restarted as PID 22439, hash b34eb5259c8c3eb5 on both
sides, configuration unchanged, still waiting for ALL-PROBES-DONE;
probe processes unaffected. A trap it had avoided earlier in the day
and stepped into for a comment.

Receiver's reading of n4a + n4b (sci-rad-01, its commit 5318be7):

- Shape verdict, from two points, before the probes built for the
  question have landed:
  ```
  concrete 0.00-0.25 cumulative   10.23 +- 0.055
  concrete 0.25-0.50 increment    12.51 +- 0.10
  difference +2.28 +- 0.11   ->   20 sigma   NOT FLAT
  ```
  Registered reading: flat = geometry; not flat = spectrum-dependent
  removal, sign carries mechanism; rising = moderation into an
  absorber. Same direction as WC-B4C (13.1 -> 16.1 -> 17.0).
  Integrator's check (arithmetic, not a measurement): a join bias of
  the WC-B4C size (+5% on T per join = 0.021 decades) would shift a
  0.25 m increment rate by about 0.085 decades/m, 1/27 of the
  observed difference; the verdict does not depend on b. Note: n4b
  ran to completion and was not among the cancelled rows (n4c, n4d,
  m4a-d were).
- Purpose of the four probes, restated before they land: no longer
  "flat / not flat" (answered) but the shape at four depths, whose
  asymptote is the design-relevant number - a thick shield is
  governed by its deep rate, not its near-surface rate. WC-B4C rose
  22% then 6%, decelerating toward a plateau; if concrete has the
  same form, "2.87 / rate" should use the plateau value, not the
  surface 10.23. Discriminator -> extrapolation.
- The section-146 comparison arrived looking alive: T(2 cuts over
  0.50) = 2.058e-6 against T(1 cut, seg6) = 5.0e-6, ratio 0.412, but
  seg6 is 2 records (+-71%), so 0.412 +- 0.291, 2.0 sigma from 1,
  opposite in sign to the WC-B4C +10%. Printed here in the
  section-144 form, one sentence: **0.412 +- 0.291, denominator is 2
  counts, not a measurement of b.** The run that answers b in
  concrete is c5 against n4a (about 1,100 records at each end).
- On the producer's self-catch: "a file being read is not a file
  that can be edited in place" - same family as "a label is not an
  identity": the product's identity at run time was assumed.

Receiver's corrections accepted (sci-rad-01, its commit 38fd74e):

- n4b ran to completion; "the answer came from a run being
  cancelled" was a better-sounding story than what happened, and is
  withdrawn from its receipt.
- The join-bias check reproduced independently: +5% per join =
  0.0212 decades, spread over n4b's 0.25 m = 0.0848 decades/m, 3.7%
  (1/27) of the observed 2.28 decades/m difference. Sign: an extra
  join raises T and so lowers the apparent rate, so removing b would
  make n4b's rate higher and the rise steeper, not gentler. The
  shape verdict does not depend on b, and b pushes the same way.
  The receiver notes it should have asked "is my conclusion
  contaminated by the bias I just measured" before announcing 20
  sigma; the question cost nothing.
- Probe reading fixed before the data: purpose is extrapolation of
  the asymptote; all records, point estimate, decades per metre of
  slab, no path correction, 1 sigma printed beside and not moving
  the verdict, error floor 2.84%.

Probe 0.10 m (tokamak, numbers only; source ss_5, zone steel 0.06):
07:49:10Z, out 54,109 / 400,000, a = 0.1165. Script row, slab
basis: 8.69 decades/m, 1 sigma [8.56, 8.81] (N_eff = min(propagated
1,238, exits 54,109) = 1,238), verdict (slab) > 6; information
column path value 5.10. Cumulative T(t = 0.10) = T(4.235) x 0.1353
= 2.217e-8, does not reach 2.2e-10. Same-source points already on
record: n4a (0.25 m) 10.23, seg6 (0.50 m) 10.60; shape and
asymptote are the receiver's. Probe 0.20 running. The delivery's
probe section is being aligned to the propagated error basis (the
printed [8.67, 8.71] was exit-count based and is to be replaced).
Done (tokamak): probe section and deep-region table both print 1
sigma from N_eff = min(propagated, exits); probe 0.10 row now
`8.69 | [8.56, 8.81]`, matching analyse_probes.py. Probe table
timestamp column relabelled "waiter start stamp (segment run time
in progress.log)" so 07:00:37Z is not read as the run time; probe
duration stamp fixed (0.10 m segment 8.5 min). Gates 225 green.

Receiver's reading of the first probe (sci-rad-01, its commit
72026fa): the required thickness is no longer an extrapolation; it
falls between two measured points.

- Well-counted cumulative curve (decades/m of slab):
  ```
  t=0.10  8.69     t=0.25  10.23     t=0.50  11.37 (n4a x n4b)
                                             10.60 +- 0.61 (seg6, 2 records)
  rising, decelerating
  ```
  At 0.50 m the two-cut product (1,105 and 298 records at its ends)
  is taken over the single-cut seg6 (2 records): same depth, take
  the well-counted one; it carries one more join, whose bias is
  known and small.
- Cumulative decades: 2.559 at 0.25 m, 5.687 at 0.50 m; needed
  2.87; increment rate 12.51 decades/m over 0.25-0.50 gives 2.87
  decades at **t = 0.275 m**, inside the measured interval. No
  model, no extrapolation; the monotonicity relied on is the 20
  sigma measurement, not an assumption. The asymptote fit (its
  ledger 13) is not needed for this number - built for a question
  the data answered more directly (recorded as it happened, not as
  foresight). Sensitivity: increment rate +-5% moves t by +-0.001 m.
- Everything unapplied points the same way: b = +5%/join unapplied;
  n4a x n4b carries two joins, so T is over-reported, the true rate
  higher and the true thickness thinner, by about 0.005 m here. Not
  applying it is the conservative choice.
- Conditional: the "> 6 decades/m suspect the chain first" trigger
  still stands, so 0.275 m is "what this chain says", not
  "established", and that clause must travel in the same sentence
  (section 144): a thickness without it is a thickness that will be
  built to. Suggested cell: "required concrete ~ 0.275 m
  (interpolated between measured points; conditional: > 6 trigger
  not cleared; b unapplied, applying it gives thinner)".
- Error basis: [8.56, 8.81] is the propagated 1,238; [8.67, 8.71]
  counted 44x more information than exists.

Integrator's note on the target number (arithmetic, for the
deliverable's cell): 2.87 decades is log10(1.639e-7 / 2.2e-10).
The registered driver TARGET is 1.92e-10 (covers t <= 5.3 m, rule:
round toward the constraint), which needs 2.931 decades and gives
t = 0.280 m; the exact t = 0 requirement 2.08e-10 gives 2.896
decades and 0.277 m. The difference is inside the b allowance, but
the printed cell should be computed against the registered target,
so 0.28 m, with the same conditional clause.

Deliverable cell landed (tokamak; probe section, all computed by
script from measured points, new probe points re-enter the table
and re-interpolate automatically):

| t [m] | cumulative T(t) | cumulative decades | exits N at point |
|---|---|---|---|
| 0.00 | 1.639e-7 | 0.000 | 218,898 |
| 0.10 | 2.217e-8 | 0.869 | 54,109 |
| 0.25 | 4.528e-10 | 2.559 | 1,105 |
| 0.50 | 3.373e-13 | 5.687 | 298 |

> Required concrete ~ 0.280 m (against registered TARGET =
> 1.92e-10: 2.931 decades needed; linear in log10 T between measured
> points t = 0.25 and 0.50, no model, no extrapolation; conditional:
> > 6 decades/m trigger not cleared; b unapplied, applying it gives
> thinner).
> Required concrete ~ 0.275 m (against run control 2.2e-10: 2.872
> decades; same method, same condition).

Chain segment 6 (2 records) is comparison only, not in the table.
Integrator checked the products: each row is the previous row times
that point's exit fraction (0.1353, 2.7625e-3, 7.45e-4).

Origin of 2.2e-10 found (sci-rad-01, first-principles recompute,
its commit 9b20336):

```
r = 0      reactor centre, path 139.6 m      2.212e-10  <- the carried 2.2e-10
r = 4.235  t = 0, path 135.365 m             2.080e-10
r = 9.535  t = 5.3 m, path 130.065 m         1.920e-10  <- registered driver value
```

- 2.2e-10 measured the path from the reactor centre; escape is
  defined at r = 4.235. Its own evaluator d_ref() already used
  path = R_VILLAGE - r_face (with a comment that the emitting face
  moves outward with t, "small, unfavourable, written in not
  footnoted"): the criterion and the quantity it judges used
  different geometries - the evaluator moved the source, the target
  did not, and they had been compared since ledger 8.
- Direction: 2.212 / 2.080 = 1.063, the carried target was loose by
  6.3%, 0.0267 decades, 2.1 mm of thickness. Numerically nothing;
  on the loose side of a criterion whose whole meaning is
  direction. Third time on the loose side of a directional
  threshold (1.95e-10, 0.0381, now this), the first caused by
  geometry rather than typing.
- Structural fix: target_escape(t) derived from TARGET_CONSERVATIVE,
  R_VILLAGE - (R_CRYO + t), S_N, H_1MEV: t=0 2.080e-10, t=1.0
  2.049e-10, t=5.3 1.920e-10. Target tightens with thickness, so the
  governing value is the one at the deepest thickness considered,
  the registered 1.92e-10; TARGET_ESCAPE = 1.9202e-10, stricter than
  the carried value and no longer stale when a ratio moves.
- Ruling accepted, one addition to print with it: the 0.275 m row's
  footnote must read "run-control value, known to have been computed
  at the reactor centre, loose by 6.3%"; otherwise two rows side by
  side read as two credible bases, one of which is known wrong.
  Same rule as the c = 1 column: an excluded old value printed
  alongside must say why it was excluded. Forwarded to the
  deliverable owner.
- Done (tokamak, delivery line 290): the 0.275 m row now reads
  "against run control 2.2e-10 - known loose by 6.3%: path computed
  from the reactor centre r = 0 (sci-rad-01 9b20336); the same
  criterion at the escape face r = 4.235 is 2.080e-10, at t = 5.3
  1.920e-10 = registered value; printed for comparison only, not a
  credible basis". The registered-target row is labelled "governing
  value, target tightens with t, taken at the deepest thickness".
  Side note: the write guard added this morning fired for the first
  time in earnest - the edit's name string carried a `%%` (it passes
  through `%s` substitution, not formatting, so a single `%` is
  correct); the guard refused the write with a line number, fixed
  and passed. Gates 225 green.

Ruling on the first-line wording (tokamak asked, did not decide):

- Question: the cut slab n4a x n4b gives, at t = 0.50 m, 298
  records and cumulative T = 3.373e-13, which meets the letter of
  the qualification gate (T <= target and >= 18 records) and is a
  2-cut vs 1-cut same-thickness reproduction of chain segment 6
  (0.50 m, 2 records, 8.195e-13; ratio 0.41 inside the 2-count
  +-70%). The first line only reads chain segments and still prints
  `EXHAUSTED, NOT RESOLVED`.
- Ruling: verdict unchanged. A parallel sentence is printed after
  the first line: "Cut slab t = 0.50 m: 298 records, cumulative
  T = 3.37e-13 <= registered target 1.92e-10 - NOT RULED: (a) the
  > 6 decades/m trigger is not cleared; (b) the point comes from the
  cut slab n4a x n4b (two joins, b unapplied), not from a chain
  segment; chain segment 6 at the same thickness (2 records,
  8.2e-13) is comparison only. Clearing conditions: c5 transfer
  verdict + probe shape clear the trigger, and the receiver accepts
  the cut-slab basis as the chain's basis." Reason, same rule as
  the c = 1 column and the 0.275 m row: a number that qualifies by
  the letter of a gate but is withheld must be printed together
  with the reason it is withheld, not left for the reader to find
  in the probe section. Target written as the registered 1.92e-10,
  not 2.2e-10. Copied to sci-rad-01; an objection from it on the
  reading rules overrides this wording.

Probe 0.20 m (tokamak, numbers only): 07:58:35Z, out 4,131 /
400,000, a = 0.1163. Script row, slab basis: 9.93 decades/m, 1
sigma [9.87, 9.99] (N_eff 1,238), verdict > 6; information column
path value 5.83. Cumulative T(t = 0.20) = 1.693e-9 (1.986 decades),
not reached. Adjacent increment rate (slab) 0.10 -> 0.20 = 11.17.
Cumulative decades at t = 0 / 0.10 / 0.20 / 0.25 / 0.50: 0 / 0.869
/ 1.986 / 2.559 / 5.687. Required thickness unchanged (bracketing
points still 0.25 and 0.50): 0.280 m (registered) / 0.275 m
(run control, marked loose). Probe 0.30 running from 07:58Z.
Integrator's arithmetic check: 4,131/400,000 = 1.0328e-2, log10 =
-1.986, matches; 0.869 + 0.10 x 11.17 = 1.986, matches.

First-line parallel sentence landed (tokamak, delivery line 5,
numbers by script from the cut files, wording as ruled); verdict
unchanged `EXHAUSTED, NOT RESOLVED`.

Ruling on the first-line threshold (tokamak asked, did not change
it): the first line itself still printed "target <= 2.2e-10", the
run-control value known loose by 6.3%, next to the parallel
sentence's 1.92e-10. Ruled: the first-line threshold and the
qualification gate (T <= threshold and >= 18 records) use the
registered 1.92e-10; "short by" moves 2.87 -> 2.93 at the main
face; 2.2e-10 remains only in the row marked loose / comparison.
Reasons: the driver TARGET was already 1.92e-10, so the first line
was out of sync with the driver, not a new basis; this is a
post-data change in the tightening direction, stated as such; the
script must print one line confirming the change flips no printed
verdict (every point is far above or far below both thresholds),
and stop and report if any verdict flips. Copied to sci-rad-01,
whose objection overrides.

Receiver's response to the first-line ruling (sci-rad-01, its
commit a083c65): no objection to verdict unchanged + parallel
sentence; two points, one a hole of its own.

- Reason (a) stands and exposes the hole: a trigger was registered
  without its clearing condition. "Chain faulty" would invalidate
  chain and cut slab alike, so the trigger holds any result of this
  code - valid. But the diagnosis is essentially settled: the band
  is a hard-spectrum band applied to a soft incident spectrum (76%
  below 27.5 keV), and section 132 established that its reading
  rule declared a material domain and no spectrum domain. The
  trigger rings on a defect of that rule, not on evidence of a
  chain fault - a reason to fix the rule, not a reason to clear the
  trigger; the two are not to be mixed. A trigger without a
  clearing condition can only be cleared by debate, which is what
  pre-registration exists to prevent.
- Clearing conditions now written, direction named (the data that
  satisfy them already exist at the time of writing, so this is a
  loosening move; written checkable and not self-applied):
  ```
  (i)   depth curve confirms spectrum-dependent removal - done, 20 sigma, registered before data
  (ii)  c5 returns a b in concrete consistent with WC-B4C - pending
  (iii) the band is explicitly re-domained as "hard spectrum", soft incident declared out of domain -
        by the rule's owner (sci-rad-01), so reviewed by a party that does not benefit
  ```
  Until all three hold, the trigger stands and every downstream
  number carries it. (iii) is the costly one: changing one's own
  rule passes through another's hands.
- Reason (b) was half reversed in the integrator's wording. "Not a
  chain segment" stands (a provenance reservation). "b unapplied"
  points the other way: b means T over-reported, true T lower, so
  correcting it strengthens "resolved". (b) is a provenance
  reservation, not an evidence reservation; listing an unapplied
  correction as a reason for doubt reversed its direction. Wording
  replaced: "from the cut slab (two joins), not a chain segment; b
  unapplied, and applying it would make this reading stronger, not
  weaker." Sent to the deliverable owner as a correction.
- Said to the end, because what is withheld is not the number:
  T(0.50 m concrete, from ss_5, 298 records) = 3.37e-13 <= 1.92e-10,
  margin 570x, while the interpolation puts the requirement at
  0.275 m. Physically, half a metre of this concrete is ample. What
  is withheld is the claim, and the trigger withholding it rings on
  the receiver's own under-specified rule. Printed with the verdict
  so the reader does not take the data as suspect.

Integrator: takes the (iii) review (does not benefit; the tokamak
benefits and does not review). Review basis written before the
text arrives: the re-domaining text must contain (a) the band's
derivation spectrum and the criterion for "hard" (energy or
fraction, as numbers); (b) the out-of-domain statement verbatim and
its place in the rule section 132 points to; (c) one line "this
change alters no printed verdict". The review checks that these
three are present and consistent, not whether the physics should
be divided this way. The first-line threshold ruling (1.92e-10) is
recorded as in force, no objection received.

Threshold ruling landed (tokamak): first line "... target <=
1.92e-10 (registered) - EXHAUSTED, NOT RESOLVED ..."; qualification
gate T <= 1.92e-10 and >= 18 records; "short by" against the
registered value (2.93 printed when the main face is outermost).
Following sentence: "Threshold basis: first line and gate use the
registered 1.92e-10 (driver TARGET; the earlier 2.2e-10 was out of
sync with the driver, not another basis). Post-data change,
direction TIGHTENING. Script checked: flips no printed verdict
(check points: chain face, cut t = 0.25 / 0.50, every probe face -
each point has the same verdict under both thresholds)." The flip
check lives in the generator: any point whose verdict differs
between 2.2e-10 and 1.92e-10 => not written, stop and report; this
run passed. 2.2e-10 remains only in the row marked loose 6.3% /
comparison. Gates 226 green; probe 0.30 running.

Receiver (sci-rad-01, section 150, its commit 0351543): no
objection; it had already moved its own threshold the same way.
Its flip check: chain first line 1.639e-7 is "above target" under
both 2.2e-10 and 1.9202e-10; cut slab 3.373e-13 is "not above"
under both; required thickness 0.275 -> 0.280 m is a number, not a
verdict. No verdict flips. The check is a function
(verdicts_unchanged), not a one-off - "a rule applied once is a
rule remembered, not a rule installed; the next threshold move
needs it and nobody will remember" - with a self-test that shows a
case where it does flip, so it is not a check that cannot fail.
Increment rates now four intervals, rising and decelerating:
0.00-0.10 8.69 / 0.10-0.20 11.17 / 0.20-0.25 11.46 / 0.25-0.50
12.51. Bracketing points still 0.25/0.50, thickness cell
unchanged. After 0.30 and 0.40 it will give an asymptote reading,
diagnostic only, not into the thickness cell (governing value stays
the interpolation between measured points).

Corrected parallel sentence landed (tokamak, delivery line 7,
wording per a083c65 as sent). Margin printed by script: 1.92e-10 /
3.373e-13 = 569.2, printed 569 (the 570 in the ruling was a
rounding of the same number; the script's value governs). Gates 226
green.

Ruling: withdraw the band, keep the hold (sci-rad-01 disclosure
2c7c212; ruled by the integrator, who does not benefit):

- Disclosure: (a) of the review basis cannot be supplied. Reading
  rule 1 reads "Expect 1-6 decades/m"; behind it there is no
  derivation and no source - it was recalled. Ledger 1 carries a
  provenance note dated 2026-08-25, written after the sci-rad-02
  session named the pattern: "the value is self-chosen, the label
  points to an authority we never consulted". The band is an
  instance of that pattern, recorded weeks ago and then used as a
  trigger. Re-domaining is not a re-derivation; it would be a
  second recollection, adjusted after seeing the data that made the
  first one ring, by the same person. A rule with no source, firing
  outside a domain it never declared, whose repair would be fitted
  to the firing, is not to be repaired: withdraw, not amend.
  Direction: withdrawing releases the hold on deep results, which
  is loosening and favours the station; that and "honesty requires
  withdrawal" are both true and neither settles it alone, so the
  decision is not the owner's, precisely because the owner benefits.
- Ruling, three sentences. (1) The "Expect 1-6 decades/m" band is
  WITHDRAWN: no source, no derivation, fired outside an undeclared
  domain, any repair would be fitted to the firing. Reason printed
  as "no provenance", not "contradicted by data". (2) What it held
  is NOT released: the hold on deep results is re-hung on sourced
  conditions - the chain-fault question passes to the
  pre-registered (i) depth curve (done, registered before data)
  and (ii) c5 transfer verdict (pending); until (ii) holds, the hold
  stands and every downstream number carries it. (iii) is cancelled
  with the rule - not a loosening, it was a repair of a baseless
  rule. This ruling moves no number from unquotable to quotable, so
  it is direction-neutral; that is the premise on which the
  integrator rules it. (3) Before the c5 data land, sci-rad-01 is to
  write (ii)'s "consistent" as a number: within how many sigma or
  what absolute difference b_concrete must sit of b_WC-B4C
  (+4.93 / +5.25 +- 0.90%), and what exceeding it means (chain
  suspect stands, hold continues). Without that number (ii) is
  another condition cleared by debate.
- Printed as part of the proposal, in the deliverable and here, as
  an open item: this project has no sourced concrete attenuation
  reference; from the day the reading rule was written it has run
  on recollection. What takes over the trigger's real question:
  A/B record consistency (one real catch on real data); spectral
  balance / rate stability (NOT EVALUABLE on the chain, one
  concrete face; evaluable on the probes); the tokamak's
  independent estimate for the actual incident spectrum, 11-12
  decades/m against measured 10.6 - also built on cross-sections
  cited from memory, but another party's estimate of this specific
  case, checkable by a third party: recorded as a cross-check, not
  a reference. None of the three replaces a sourced attenuation
  reference.
- Delivery line 7 (a) rewritten accordingly (sent to the tokamak):
  chain-fault hold not cleared; the original band withdrawn (no
  provenance, not contradicted; 2c7c212, integrator's ruling); hold
  re-hung on (i) done and (ii) pending with a numeric criterion to
  be registered before c5 lands; (iii) cancelled; script to print
  that the change moves no number from unquotable to quotable.
- Landed (tokamak, no number changed): line 7 (a) as ruled, with
  the script's check sentence at its end: "before and after the
  withdrawal every deep number's quotability is 'unquotable' - this
  change moves no number from unquotable to quotable (hold flag:
  held -> held)". Every verdict column (deep-region table, probe
  table, cut analysis, probe analysis - one function) now prints
  "band withdrawn (no provenance; 2c7c212) - not ruled"; zero-exit
  rows print "no verdict (bound X; band withdrawn, nothing to
  compare)". Deep-region table header rewritten: verdict column's
  band withdrawn, hold hung on (i)(ii). Open item added to the
  limitations section: no sourced concrete attenuation reference;
  the tokamak's own "0.1-0.4 MeV in this concrete ~ 11-12
  decades/m" recorded as a cross-check (cross-sections cited from
  memory, checkable by a third party), not a reference. Threshold
  ruling unchanged. Gates 226 green.

Receiver's (ii) numeric criterion (sci-rad-01, its commit d984821,
written before c5 data), with one premise corrected first:

- "b_concrete consistent with b_WC-B4C" is not a fault test: b is
  the per-join re-representation bias and may legitimately differ
  by material (angular distribution and spectral structure at the
  cut face differ). A fault criterion built on inconsistency would
  judge correct physics as a fault. So the deciding criterion is
  magnitude and consequence; consistency is reported, not deciding.
- Primary (decides the hold):
  ```
  |b_concrete| <= 15%/join  ->  (ii) satisfied
     5 joins to the main face -> cumulative <= 2.01x -> governing 0.280 m moves <= 2.4 cm (9%)
     and flips no verdict (D_ref flip band 3.07%, escape target margin 570x)
  |b_concrete| >  15%       ->  not satisfied, hold continues, reason written as MAGNITUDE, not inconsistency
  ```
  Integrator's arithmetic check: 1.15^5 = 2.011; log10 = 0.303
  decades; at 12.51 decades/m = 0.024 m; 2.4/28 = 8.6%. Matches.
- Secondary (reported, not deciding), sigma_diff = 0.90 pp (c5
  sigma_b = 1.06 pp on the N_eff floor 1,238; WC-B4C 0.90 pp):
  ```
  |b_c - b_W| < 1.8 pp          same behaviour in both materials
  1.8 - 3.6 pp                  material-dependent, not a fault
  > 3.6 pp and |b_c| > 15%      suspected fault - both conditions together, never one alone
  ```
- Third branch as proposed: if the c5 ratio is within 2 sigma of 1,
  b_concrete is "unresolved", not "zero" - not measured, hold
  continues, basis unchanged; a hold is not cleared by an absence.
- Integrator's objection, sent before c5 data: the third branch
  contradicts the primary. At sigma_b = 1.06 pp, b = 0 +- 1.06 pp
  satisfies |b| <= 15% at more than 10 sigma; it is a measurement,
  not an absence. Under the third branch any true |b| < 2 pp could
  never clear the hold. The consistent form is an upper limit:
  |b_c| + 2 sigma_b <= 15% => (ii) satisfied; otherwise (including
  sigma_b so large that the limit crosses 15%) => unresolved, hold
  continues; "absence does not clear a hold" is reserved for the
  crossing case. Direction stated: relative to the third branch
  this is loosening, raised before data on the ground of a logical
  contradiction; if the receiver keeps the stricter reading, the
  primary must be rewritten to match it with reasons - the two
  cannot coexist. Awaiting which form it registers.
- Its reading of the ruling: it had treated "rule" and "hold" as one
  thing, which turned a decidable question into an undecidable one;
  the direction-neutral split is what made it decidable by a
  non-benefiting party. The open-item sentence (no sourced concrete
  attenuation reference) it calls the sentence from its station
  most in need of being seen by others.

(ii) registered in the upper-limit form (sci-rad-01, its commit
1c2da11, before c5):

```
|b_c| + 2 sigma_b <= 15%            ->  (ii) satisfied
|b_c| > 15%                          ->  not satisfied, hold continues, reason MAGNITUDE
otherwise (sigma_b so large the limit crosses 15%)  ->  unresolved, hold continues
```
Drills: 0 +- 1.06 -> 2.12 satisfied; 5.09 +- 1.06 -> 7.21
satisfied; 5.0 +- 8.0 -> 21.0 unresolved; 20.0 +- 1.06 -> 22.1 not
satisfied. The objection checked: b = 0 +- 1.06 satisfies |b| <=
15% at 14 sigma, a precise measurement of a small b, not an
absence; under the old branch any true |b| < 2.12 pp could never
clear. The error is section 126 repeated by its author two hours
later: "consistent with zero is not a measurement" was written for
the coupling, where the observable is dT/T and a null means the
run had no resolving power - correct there; here the question is
|b| <= 15% and 0 +- 1.06 answers it decisively. A rule carried
outside the situation that produced it. The option "keep the
stricter reading and rewrite the primary to match" declined: that
was not a stricter reading being given up, it was an error, and
taking the option would elevate an error into a choice. General
lesson recorded: conservatism belongs to the form of the test, not
to a clause hung beside it; a form does not contradict itself, a
clause can, and that one did.

Probe 0.30 m (tokamak, numbers only): 08:08:45Z, out 284 /
400,000, a = 0.1174. Script row, slab basis: 10.50 decades/m, 1
sigma [10.41, 10.58] (N_eff = min(1,238, 284) = 284); verdict
column "band withdrawn - not ruled"; information column path value
6.16. Cumulative T(t = 0.30) = 1.164e-10 <= registered 1.92e-10 and
284 >= 18, so the probe table's status column prints "reached and
>= 18 records" - by the section's fixed sentence this does not
change the first line; the chain-fault hold stands (condition (ii)
awaits c5). Increment rates (slab): 0.10 -> 0.20 = 11.17, 0.20 ->
0.30 = 11.63. Cumulative decades at t = 0 / 0.10 / 0.20 / 0.25 /
0.30 / 0.50: 0 / 0.869 / 1.986 / 2.559 / 3.149 / 5.687. Required
thickness re-interpolated, bracketing points now 0.25 and 0.30:
~ 0.282 m (registered) / 0.277 m (run control, marked loose,
comparison). Probe 0.40 running; c5 after it (numbers first; the
(ii) criterion is now registered, 1c2da11, so the verdict can be
printed by script when the numbers land).
Integrator's arithmetic check: 284/400,000 = 7.10e-4, log10 =
-3.149; 3.149/0.30 = 10.50; (2.931 - 2.559)/((3.149 - 2.559)/0.05)
= 0.0315 -> 0.2815 m. Matches.

Receiver on probe 0.30 (sci-rad-01): it passes the qualification
gate and differs from the cut-slab case - the provenance
reservation (b) does not apply to it. Cut slab t = 0.50 has two
joins (ss_5 -> n4a -> n4b); probe t = 0.30 has one join (ss_5 ->
0.30 m concrete, zone steel 0.06), the same join structure as the
chain's own seg6. What holds it is (i) + (ii) only, which are
procedural, not provenance. T(0.30) = 1.164e-10 <= 1.9202e-10 with
284 >= 18 records, margin 1.65x, single-join measurement.
Suggested cell wording adopted and ruled (sent to the tokamak):
"reached and >= 18 records; single join, same source as the chain,
provenance reservation not applicable; hold on (i) done + (ii)
pending - (ii) is a check of mechanism coherence, not doubt about
this number." Writing why it is held is harder to misread as "the
number is suspect" than writing only that it is held. Integrator's
added arithmetic (not a verdict), for the script to print: under
any b within the (ii) bound in either direction (+-15%, one join),
T_true lies in [1.01e-10, 1.37e-10], still <= 1.92e-10 - the point
is insensitive to the sign of b. Its reproduction of the
interpolation: 0.25-0.30 increment 11.80 decades/m; need 2.931 ->
0.2815 m; need 2.872 -> 0.2765 m. Clean non-overlapping
increments: 0.00-0.10 8.69 / 0.10-0.20 11.17 / 0.20-0.30 11.63 /
0.30-0.50 12.69 - the last interval is 0.20 m wide and averages
more of the rise, not directly comparable with the 0.10 m ones;
the asymptote reading waits for the clean 0.30-0.40 increment,
diagnostic only. For the record, said as what it is not: 0.30 m of
this concrete meets the target directly (284 records, single join,
the chain's own source; interpolated minimum 0.282 m); the hold
stands on a procedural condition, not a missing answer. Not a
request to release.

Condition (ii) implemented (tokamak, analyse_cut_test.py c5 panel,
verdict printed with the numbers when c5 lands): from R = T(5 cuts)
/ T(n4a), delta n = 4: b_c = R^(1/4) - 1, sigma_b = sigma_R x
R^(-3/4) / 4 (first order). Three branches per 1c2da11 verbatim;
"not satisfied" prints the magnitude as a multiple of the
threshold. The script reproduces all four drill cases. WC-B4C
measured +4.93% +- 0.90% printed alongside as comparison, not in
the verdict. Gates 227 green. Integrator's check: db/dR = R^(-3/4)
/ 4, correct; with both ends on the 1,238 floor sigma_R / R ~ 4.0%,
so sigma_b ~ 1.0 pp, consistent with the 1.06 pp used in the drills.

Receiver on the sign-insensitivity arithmetic (sci-rad-01):
checked and pushed one step: b = +15% -> T_true = 1.012e-10; b =
-15% -> 1.369e-10; the b that puts T_true exactly on target is
-39.4% per join - the chain would have to UNDER-report T by 39%
per join for this point to cross, while every measured b so far
is positive (+4.93%, +5.25%, over-reporting); the breaking
direction is the one every measurement denies, by 8x in
magnitude. What may not be read from it: "b cannot move this
number" and "the hold has no effect on this number" are different
sentences and only the first is established. (ii) is a fault
indicator, not only a correction: a misbehaving machine can fail
in ways a single-parameter b does not capture (spectral distortion
at the cut face, angular truncation, a bookkeeping error); a large
|b| says "the machine is misbehaving", not only "multiply by a
factor". Sentence printed in full, ruled and sent to the tokamak:
"this point is insensitive to b within +-15% (needs -39.4%/join to
cross, opposite to every measured direction); but (ii) is a fault
indicator, not only a correction, so the hold is not released on
this basis." The half sentence would become "so the hold is
pointless", which is not what the arithmetic says.

Landed (tokamak): probe table 0.30 row status cell as ruled plus
correction; margin, T_true interval and crossing b all computed by
script. Any qualifying single-join probe row (0.40 if it qualifies)
prints the same format automatically with its own margin and
interval; the table's target column header now reads "against the
registered target 1.92e-10". First line unchanged. Gates 227 green;
probe 0.40 finishing.

Probe 0.40 m, all four probes in (tokamak, numbers only; shape and
asymptote are the receiver's):

| t [m] | exits N / 400,000 | a | cumulative decades/m (slab) | 1 sigma (N_eff) | cumulative T(t) | status (vs 1.92e-10) |
|---|---|---|---|---|---|---|
| 0.10 | 54,109 | 0.1165 | 8.69 | [8.56, 8.81] (1,238) | 2.217e-8 | not reached |
| 0.20 | 4,131 | 0.1163 | 9.93 | [9.87, 9.99] (1,238) | 1.693e-9 | not reached |
| 0.30 | 284 | 0.1174 | 10.50 | [10.41, 10.58] (284) | 1.164e-10 | reached and >= 18 records |
| 0.40 | 15 | 0.1168 | 11.06 | [10.78, 11.35] (15) | 6.146e-12 | reached but < 18 records (starved) |

Adjacent increment rates (slab): 0.10 -> 0.20 11.17, 0.20 -> 0.30
11.63, 0.30 -> 0.40 12.77. Same-source comparison points: n4a
(0.25) 10.23, n4a x n4b (0.50) 11.37, seg6 (0.50, 2 records) 10.60.
Required thickness unchanged (bracketing 0.25/0.30): 0.282 m /
0.277 m. ALL-PROBES-DONE 08:20:24Z; c5a started 08:20:58Z
(reference n4a 1,105 records), five sub-segments about 45 min;
on landing the (ii) criterion is applied and the verdict printed
with the numbers.
Integrator's arithmetic check: 15/400,000 = 3.75e-5, log10 =
-4.426, /0.40 = 11.06; (4.426 - 3.149)/0.10 = 12.77; matches. The
0.40 point carries a 15-count error (about 0.11 decades on the
cumulative, about 1.1 decades/m on the 0.30-0.40 increment); the
last increment is the least determined of the four.

Check 3 (rate stability) rerun on the probe family and entered in
the delivery (tokamak); the chain's own row stays NOT EVALUABLE
(not PASSED). Probe family: same material, same source ss_5, same
steel zone 0.06, thickness the only difference.

| interval [m] | increment decades/m (slab) | +- 1 sigma (both-end counts, N_eff = min(propagated, exits)) | exits N at interval end |
|---|---|---|---|
| 0.10 -> 0.20 | 11.17 | +- 0.17 | 4,131 |
| 0.20 -> 0.30 | 11.63 | +- 0.29 | 284 |
| 0.30 -> 0.40 | 12.77 | +- 1.15 | 15 |

Cross-interval scatter max/min - 1 = 14.3% (12.77 / 11.17),
monotonic rise; the last interval's 1 sigma (+-1.15) is of the
same order as the scatter - arithmetic, not a reading. The "> +-10%
=> demote to an order-of-magnitude statement" rule is the
receiver's to apply; the delivery only prints. Gates 228 green.

Asymptote reading, diagnostic (sci-rad-01, its commit ea3b203):
cannot be measured, and it costs nothing - which is what
registering it as subordinate was for.

- Increments with errors: 0.00-0.10 8.69 +- 0.12; 0.10-0.20 11.17
  +- 0.17; 0.20-0.30 11.64 +- 0.29; 0.30-0.40 12.74 +- 1.15 (15
  records); last step +1.10 +- 1.13, 1.0 sigma, not significant.
  The curve is still climbing at the last point and the last step
  is indistinguishable from flat: four points neither show
  saturation nor exclude it.
- Registered fit run anyway, degrees of freedom reported: r_inf
  11.66, r0 6.80, lam 0.200, rms 0.057, 1 degree of freedom;
  thickness by asymptote 0.251 m; model-independent bound: 8.69 at
  0.10 -> thickness <= 0.337 m. Data that never turn cannot
  constrain r_inf; a three-parameter approach form fitted to four
  rising points always returns an asymptote, and the number it
  returns is the fit's, not the material's.
- Downstream unmoved: governing thickness still 0.282 m,
  interpolated between the measured 0.25 and 0.30 points. A
  diagnostic came back empty and the deliverable did not move -
  what "a diagnostic is genuinely subordinate" looks like, visible
  only because the subordination was registered before the fit
  ran, when it could still have become the answer.
- Correction to its own error bars: the N_eff cap is common-mode
  across probes launched from the same ss_5 sample (source-sampling
  fluctuation is shared and largely cancels in a ratio of two
  transmissions), so the increment errors above, which add the cap
  independently at each point, are conservative. It does not
  rescue the 0.30-0.40 step, which is count-limited (15 records).
- Measuring the asymptote would need counts deeper, not more
  points - beyond 0.50 an order of magnitude per 0.10 m. Not
  proposed: the governing thickness does not need it, and the
  section-136 question (is there a conclusion that needs it)
  answers no.

Check 3 on the probe family, receiver's application of its own rule
(sci-rad-01, its commit 6f72a45): does not fire. Two layers, the
first the one that matters.

- Premise not met. Check 3's own text: "Once the spectrum is at
  equilibrium, decades/m in one material must be CONSTANT across
  successive segments. A trend means the re-representation is
  drifting." The rising rate has a measured physical cause
  (moderation into a 1/v absorber, 20 sigma), which means the
  spectrum is still evolving over 0-0.40 m, not at equilibrium.
  Applying check 3 here would judge correct physics as
  re-representation drift - the same shape as the (ii) premise
  correction: a rule used outside its own declared domain. Unlike
  the withdrawn band, this rule declared its domain; the rule is
  good, applying it here is the error, and the domain clause is
  what blocks it. A rule that carries its own premise can refuse
  itself.
- The number is also not significant, secondary: 12.77 - 11.17 =
  +1.60 +- 1.16, 1.4 sigma; the last interval's own 1 sigma is 9%,
  same order as the 14.3% scatter. This layer alone would not
  dismiss: 1.4 sigma is weak, not absent, and weak is not grounds
  to dismiss a check whose premise holds. Order: premise first,
  significance second.
- Verdict is neither: NOT EVALUABLE - not DRIFTING, not STABLE.
  The withdrawal clause "check 3 DRIFTING alone => demote to an
  order-of-magnitude statement" does not fire, because check 3
  returned nothing to fire on.
- For the limitations section: two of the three withdrawal checks
  are now NOT EVALUABLE for different reasons - checks 1 and 3 on
  the chain for lack of a concrete face, check 3 on the probes for
  lack of its premise. Recording which reason applies where is the
  difference between "these checks passed" and "these checks did
  not run" - only the latter is true.
- Landed (tokamak): the probe-family check 3 row prints NOT
  EVALUABLE with the premise reason; numeric table unchanged; the
  limitations sentence added verbatim. Gates 228 green; c5 running.

c5a (tokamak, numbers only): borated concrete 0.05 m, zone steel
0.06, source ss_5, 08:27:53Z, out 169,169 / 400,000, a = 0.1071.
c5b (0.05 m, zone concrete 0.05, source = c5a's 169,169 records)
running. After all five the script prints R, b_c and the (ii)
verdict. Integrator's arithmetic: 169,169/400,000 = 0.4229, log10
= -0.374, 7.47 decades/m over 0-0.05 (information only; the c5
sub-segment rates are not a depth curve until the joins are
judged).

c5a's a corrects a sentence in the receiver's section 145
(sci-rad-01, its commit 5dffea2): same source, same zone (steel
0.06), a against segment thickness:

```
0.05 m  0.1071  c5a          0.30 m  0.1174  probe
0.10 m  0.1165  probe        0.50 m  0.1170  seg6
0.25 m  0.1170  n4a          1.00 m  0.1177  n1
```

- 0.05 m is 8% low; the six at >= 0.10 m agree within 1%. The
  WC-B4C pair has the same shape: 0.04 m 0.0644 against 0.12 m
  0.0674, 4.5% low, same direction.
- Section 145 had said "a does not move with the segment's own
  thickness", on two pairs: concrete 0.50 vs 1.00 (0.6% apart, both
  above saturation) and WC-B4C 0.04 vs 0.12 - 4.7% apart, called
  "consistent". The 4.7% dismissed as noise was this effect; c5a
  amplifies it to 8%. The sentence is right for thick segments and
  was said without that qualifier, while the pair that shows the
  qualifier was in the data being cited.
- Mechanism consistent, so a refinement, not a withdrawal: a
  counts particles reflected from the segment that return through
  the zone and leave. A thin segment has less material to reflect;
  once the segment is thicker than the depth reflection comes
  from, more thickness adds no return - a saturates. 0.05 m below
  saturation; >= 0.10 m above it in this concrete. "a is the
  zone's failure rate" holds above saturation and needs that
  clause - a qualifier that only appears once someone measures
  below the threshold.
- Does not move (ii): b is measured from the ratio of T, not from
  a; a is diagnostic here as registered. Does not move the
  thickness cell.
- Header suggested for the a column of the per-segment table: "a
  saturates with segment thickness; >= 0.10 m is the saturated
  value, thinner segments read low" - otherwise c5a's 0.1071 reads
  as an inconsistency. Integrator's addition for the same header:
  c5b-e carry a concrete zone (0.05), not the steel zone, so their
  a values are not comparable with the steel-zone set on either
  axis (segment thickness or zone material); the header must name
  the zone as well.
- Landed (tokamak, header only, numbers unchanged): the sentence
  above the a column of the chain ledger, and the same header on
  the three a tables of the cut analysis (WC-B4C, concrete, c5).
  (ii) and the thickness cell unchanged. Gates 228 green; c5b
  running.

c5b (tokamak, numbers only): 0.05 m, zone concrete 0.05, source
169,169 records, 08:32:50Z, out 131,379 / 400,000, a = 0.0864
(concrete-zone group, not comparable with the steel-zone group per
5dffea2). c5c running. Integrator's arithmetic (information only):
131,379/400,000 = 0.3284; cumulative through c5b = 0.4229 x 0.3284
= 0.1389 (0.857 decades at 0.10 m); the single-cut probe at 0.10 m
gave 0.1353 (0.869 decades). The (ii) verdict is on the full
five-cut R against n4a, not on this partial pair.

Receiver on the partial pair (sci-rad-01): computed, and at the
same time kept from becoming the reference the final number is
read against.

- c5a x c5b = 0.13890 against the single-cut 0.10 m probe 0.1353:
  ratio 1.0266, b for this pair +2.66% per join, same sign as the
  WC-B4C +5%.
- Its significance is undetermined: treated as independent, +-4.02%
  gives 0.7 sigma; but both sides launch from the same ss_5 sample,
  so that part of the error is common-mode and largely cancels,
  while c5b's resampling from c5a adds a term whose size cannot be
  fixed without multiplicity data. True significance somewhere
  between ~0.7 and ~2.7 sigma.
- Said before the five finish: this is +2.7% from a partial
  sequence; the registered test is the full five-cut ratio against
  n4a. If it became an "expected value", the final number would be
  read against it - a new form of sections 133/134: not a
  projection taken as reference, but an early partial result taken
  as reference. Entered as "sign consistent", nothing more. The
  (ii) verdict comes from evaluate_ii(b_c, sigma_b_c) on the full
  ratio, and that call does not know this number exists - not
  discipline, structure: the criterion is a function whose inputs
  do not include it. Not only the verdict but the expectation must
  stay off the partial pair.

c5c (tokamak, numbers only): 0.05 m, zone concrete 0.05, source
131,379 records, 08:37:27Z, out 122,266 / 400,000, a = 0.0752.
c5d running.

Receiver's note on a within the c5 sequence (sci-rad-01): not a
partial ratio, a trend inside one sequence. c5b a = 0.0864, c5c a
= 0.0752, down 13%, with zone material, zone thickness and segment
thickness all fixed; the only difference is the incident spectrum,
softer deeper. Softer returning neutrons are absorbed more readily
in the borated zone and do not get back out, so a falls. A third
independent signature of the same spectral evolution: (1)
cumulative rate rising with depth, 20 sigma, registered (i), done;
(2) WC-B4C per-segment increments 13.1 -> 17.0 over three
sub-segments; (3) a falling with depth at fixed geometry. All three
follow from moderation into a 1/v absorber; no other mechanism
proposed so far produces all three. It does not touch the
registered test: a is not an input of evaluate_ii. It is a
coherence observation on a diagnostic, strengthening (i), already
recorded as done. Distinction kept: "a third sign-consistent clue"
is independent support for a finished conclusion; "an early partial
result as anchor" presets the answer to an unfinished one. The a of
c5b/c5c is the former; their T is the latter and is not touched.

c5d (tokamak, numbers only): 0.05 m, zone concrete 0.05, source
122,266 records, 08:41:53Z, out 115,074 / 400,000, a = 0.0678.
c5e (last) running, about 5 min; then R, b_c, (ii).

c5 complete, C5-DONE 08:46:09Z (tokamak; numbers and script
verdict, criterion 1c2da11 registered before data):

| item | value |
|---|---|
| c5e | 0.05 m, zone concrete 0.05, source 115,074, out 109,573 / 400,000, a 0.0624 |
| five sub-segment exits | 169,169 / 131,379 / 122,266 / 115,074 / 109,573 |
| T(5 cuts) | 3.3461e-3 |
| T(n4a, 1 cut) | 2.7625e-3 (exits 1,105) |
| R = T(5)/T(n4a) | 1.2112 +- 0.0852 (delta n = 4; error by N_eff = min(propagated 1,238, each stage's exits)) |
| b_c per join = R^(1/4) - 1 | +4.91% +- 1.84% (WC-B4C measured +4.93% +- 0.90% alongside, not in the verdict) |
| condition (ii) | SATISFIED (abs(b_c) + 2 sigma_b = 8.6% <= 15%) |
| per-sub-segment decades/m (slab) | 7.47 / 9.67 / 10.30 / 10.82 / 11.25 (1 sigma +-0.25 each; rising) |
| per-sub-segment a | 0.1071 (steel zone) / 0.0864 / 0.0752 / 0.0678 / 0.0624 (concrete-zone group) |

Pre-registered expectation (if the WC-B4C b transfers) R = 1.216;
measured 1.211 +- 0.085. Secondary criterion: abs(b_c - b_W) = 0.02
pp < 1.8 pp, same behaviour in both materials. Delivery c5 block
printed (lines 316-320), gates 234 green. Integrator's check:
product of the five fractions 0.42292 x 0.32845 x 0.30567 x
0.28769 x 0.27393 = 3.3463e-3; R = 1.2113; R^(1/4) = 1.0491; sigma_b
= 0.0852 x 1.2113^(-0.75) / 4 = 0.0184; matches.

Three items the tokamak did not decide itself, ruled (copied to
sci-rad-01; item 2 is reading-rule wording and its objection
overrides):

1. Hold released - not by ruling but as the structural consequence
   of the registered conditions (i) and (ii) being satisfied by
   the script (1c2da11 before data). Printed: "chain-fault hold
   released 08:46:09Z: (i) done, 20 sigma; (ii) satisfied (abs(b_c)
   + 2 sigma = 8.6% <= 15%, evaluate_ii); pre-registered
   expectation R = 1.216, measured 1.211 +- 0.085." Direction:
   loosening, but executing the registration, not changing it.
2. First line becomes two lines. Line 1, the chain itself,
   unchanged: "chain: EXHAUSTED at r = 4.735 (2 records)". Line 2,
   the resolved face: "RESOLVED at t = 0.30 m borated concrete:
   single-join probe, same source as the chain (ss_5, zone steel
   0.06, same join structure as seg6), 284 records, T = 1.164e-10
   <= registered target 1.92e-10 (margin 1.65x); required thickness
   0.282 m (interpolated between measured 0.25/0.30, against
   1.92e-10)." The cut slab t = 0.50 (298 records, 3.37e-13, two
   joins) printed as corroboration, not the named face - the
   provenance reservation (b) is a naming matter, and a small
   measured b does not change provenance. "NOT RESOLVED" comes off
   the first line with the reason in the same sentence (conditions
   met, not a change of basis).
3. b stays unapplied: applying it makes the shield look better
   (loosening) and the governing thickness does not need it.
   Printed as information alongside: "b measured in concrete
   +4.91%/join, consistent with WC-B4C (secondary: same behaviour);
   unapplied; if applied, main-face T over-reported 1.27x (5
   joins), thickness would drop about 0.009 m to ~ 0.273 m -
   information only, governing value stays 0.282 m."

Receiver's independent recomputation and acceptance (sci-rad-01,
its commit e4f694f): every number reproduced; no objection to 1,
2, 3. Its own evaluate_ii returns SATISFIED, abs(b) + 2 sigma =
8.60 <= 15.0; secondary: same behaviour. Three things the result
does not grant, to be written in:

- Its registered sigma was optimistic by 1.7x: it wrote sigma_b =
  1.06 pp, actual 1.84, because the five-stage propagated minimum
  is more conservative than its single-cap estimate. Verdict the
  same under both, but the power estimate was wrong, on the
  flattering side.
- Pre-registered expectation R = 1.216 against measured 1.2112:
  agreement to 0.4% with a +-7.0% error bar. R is consistent with
  the transfer hypothesis; the closeness must not be quoted as
  precision (its own section 134: when a check agrees to a
  precision the measurement cannot support) - applied this time to
  a result in its favour, the only case where applying it costs.
- The secondary criterion's constant differs between the two
  sides: its registered B_WC_B4C = 5.09 (pooled) gives 0.18 pp; the
  tokamak used 4.93 (the zone-0.04 slab) giving 0.02 pp. Same
  class, but the printed number must state which constant it used.
- On 2: thickness must sit on the same line as RESOLVED, or it
  reads as "the shielding problem is solved" rather than "0.30 m
  suffices" - the ruling's wording already carries it. Cut slab as
  corroboration, not named: a small bias does not turn a different
  measurement into this one.
- On 3: rechecked 1.0491^5 = 1.271; log10(1.271)/11.80 = 0.0088 m;
  0.282 - 0.009 = 0.273. Matches.
- Check 3 on the cleanest sequence so far (same material, fixed
  geometry, five points): rates 7.47 / 9.67 / 10.30 / 10.82 / 11.25,
  successive rises 2.20 / 0.63 / 0.52 / 0.43 - decelerating, not
  zero. The spectrum is approaching equilibrium and has not
  reached it; check 3 stays NOT EVALUABLE for the same reason as
  before, and this is the best data the question can get. Rough
  asymptote from the decay of the rises ~ 13.3 decades/m,
  diagnostic only, not into the thickness cell.

Rulings landed (tokamak; delivery 406 lines, stamp unchanged,
gates 234 green, all numbers by script from files):

- Line 3: "qualification gate - chain: EXHAUSTED at r = 4.735 m (2
  records) - the chain's own outermost T = 8.195e-13 (relative
  error 0.71), target <= 1.92e-10 (registered); starved,
  unquotable; chain reached t = 0.50 m."
- Line 5: "qualification gate - resolved face: RESOLVED at t = 0.30
  m borated concrete - single-join probe, same source as the chain
  (ss_5, zone steel 0.06, same join structure as seg6), 284
  records, T = 1.164e-10 <= registered target 1.92e-10 (margin
  1.65x); required thickness 0.282 m (log10 T interpolated between
  measured 0.25/0.30, against 1.92e-10). 'NOT RESOLVED' removed
  from the first line: registered conditions (i)(ii) satisfied,
  not a change of basis." The resolved face is chosen by script:
  the shallowest single-join probe face with T <= target and >= 18
  records.
- Line 7: "chain-fault hold released 08:46:09Z: (i) done, 20 sigma
  (registered before data); (ii) satisfied (abs(b_c) + 2 sigma_b =
  8.6% <= 15%) (judged by script from the c5 files, 1c2da11 before
  data); pre-registered expectation R = 1.216, measured R = 1.211
  +- 0.085. Direction: loosening, but executing the registration,
  not changing it."
- Line 11: cut slab t = 0.50 now "corroboration (not the named
  face): ... from n4a x n4b (two joins); the provenance reservation
  (b) is a naming matter - a small measured b does not change its
  provenance; chain segment 6 at the same thickness, 2 records,
  8.2e-13, comparison only."
- Line 344: "b stays unapplied (integrator's ruling): b measured in
  concrete +4.91%/join, consistent with WC-B4C (secondary: same
  behaviour); unapplied - applying makes the shield look better
  (loosening) and the governing thickness does not need it.
  Information only: if applied, main-face T over-reported 1.27x (5
  joins); single-join probe face 1.33x (6 joins) => required
  thickness would drop about 0.011 m (by the measured local slope
  11.8 decades/m between 0.25 and 0.30 m) - governing value stays
  the interpolation, not reduced."
- Join count ruled: 6 joins for the resolved face (5 to the main
  face + the probe's own 1 = 1.333x, ~0.011 m); the integrator's
  0.009 m was the main-face 5-join figure. Both printed with their
  join counts. Governing 0.282 m unchanged under either.
- Stale sentence caught on a read-through (tokamak): the
  limitations sentence "segment 6's re-representation zone is a
  thin buffer" still cited the pre-cut-test decomposition "buffer /
  re-representation term +29%". Replaced with the post-delivery
  facts: "buffer factor f = 0 (delta n = 0 ratio 1.006 +- 0.016);
  the per-join bias is the re-representation operation itself
  (WC-B4C +4.9%, concrete +4.9%/join, consistent), opposite in sign
  to the albedo term and, before separation, estimated at +15% by
  the governing coupling c"; the "conservative direction"
  conclusion unchanged. No "+29%" remains anywhere. 406 lines,
  gates 234, sync 17/17.
- The receiver's three sentences landed (tokamak, c5 block, by
  script): line 326 power estimate sigma_b 1.06 pp registered,
  optimistic 1.7x, actual 1.84 pp, verdict satisfied under both;
  line 327 pre-registered 1.216 vs measured 1.2112, agreement 0.4%
  with +-7.0% error, consistent with the transfer hypothesis, not
  to be quoted as precision; line 328 secondary constant named:
  this ledger uses B_WC-B4C = 4.93% (zone-0.04 slab) giving 0.02
  pp, sci-rad-01 registers 5.09% (pooled) giving 0.18 pp, same
  verdict, printed comparison uses 4.93%; line 329 check 3 on the
  c5 sequence NOT EVALUABLE, successive rises 2.20 / 0.62 / 0.53 /
  0.43 (the receiver's 0.63 / 0.52 are the same numbers, rounded
  after differencing unrounded rates - not a disagreement). Join
  count 6 as ruled, line 344 prints both (main face 5 joins 1.27x /
  probe face 6 joins 1.33x => ~0.011 m; governing 0.282 m
  unchanged). 411 lines, gates 234, sync 17/17.

Village answer on regolith moisture (hab-village-01, relayed by the
user because its session cannot send messages; recorded verbatim in
substance):

- Item 3: UNDETERMINED. No ledger of the village (berm / thermal /
  design_accounts) carries a moisture declaration with a source.
  The berm process declares only "compacted" (rho = 1.65, not
  moisture) and "regolith cover"; the regolith's origin is likewise
  undeclared (mine-site supply is a city-level inference, not a
  village declaration). Not estimated.
- Anti-readback: the thermal ledger's k = 0.05 W/m/K is a property
  value for dry, loose regolith chosen for the skin-depth
  calculation; it is not a moisture measurement and must not be
  read back as the h = 0.00 row to feed the albedo matrix. Entered
  on the berm card (specs.moisture = undetermined + a final sim
  line against readback, bilingual).
- Self-correction: the draft had treated "taken from res-mine-01"
  as a declaration; DESIGN.md carries no such source; corrected.
  The village-site row of the moisture axis is marked
  "undetermined".
- Integrator: consistent with the a_dose collapse per moisture
  (h = 0.00 0.658 / 0.03 0.538 / 0.08 0.458 / 0.15 0.405) staying
  an envelope for the village receptor, not a single value; the
  worst-receptor ratios remain as stated (2.59-5.11x), state
  BOUNDED not PENDING. Forwarded to sci-rad-01. Not a delivery
  notice: the village's four working-tree files stay unstaged.

Perimeter flux recomputed on the resolved face (sentinel network
sci-rad-02/03/04, dispatched by the user's "open" at 12:40Z; its
record mars_rad_sic/PREREG_perimeter_recompute_20260902.md):

- Result, opposite to the direction the dispatch expected: 29x
  HIGHER, not lower. At 58 m: 62.5 n cm^-2 s^-1 +-3.3%, sentinel
  count rate 2.33 cps +-3.3%. Basis: S_n = 2.271e20 n/s @ 640 MW x
  cumulative T = 1.164e-10 (t = 0.30 m resolved face) / 4 pi r^2.
  Registered target 1.92e-10; b = +4.91%/join unapplied; condition:
  the chain itself did not reach that thickness, resolved by a
  single-join probe. Comparison tier t = 0.282 m (interpolated
  face, T = 1.92e-10): 103.2 n cm^-2 s^-1. Integrator's check:
  2.271e20 x 1.164e-10 / (4 pi x 5800^2 cm^2) = 62.5; 2.33 = 0.08 x
  62.5 / 2.15. Matches.
- The unit of T was not guessed: two self-consistency relations in
  the delivery (S_n x 1.50e-5 = 3.406e15 against its "< 3.41e15
  n/s"; 1.639e-7 / 1.5e-5 = 0.0109 against its "ratio to bound
  0.01") both hold only if T is per source neutron and leakage =
  S_n x T. (The delivery path is
  E:\Claude\tokamak\neutronics\SOURCE_TERM_DELIVERY.md, one level
  deeper than the dispatch said.)
- Why the direction reversed: not the source term; the old 2.15 ->
  0.08 cps sat behind a SELF-ASSUMED 2 m shield at TVL 0.25 m (8.00
  decades), while the resolved design is 0.30 m borated concrete
  (3.15 decades) - 6.7x thinner in decades; the whole 29x is there.
  The old number was never a bound, and the card had always said
  "self-assumed, no matching design on the operator's side". The
  integrator's dispatch treated it as a bound to be tightened; that
  expectation was the integrator's error. Rule: a number labelled
  "self-assumed" for a long time is not read as self-assumed once
  it sits in someone else's table - environment.html line 417 was
  exactly that position.
- Correction against its own interest: back-solved TVL of the
  resolved concrete 0.30 / 3.15 = 0.0953 m against its assumed 0.25
  m - attenuation per metre 2.6x stronger than assumed; the
  direction favours it, the assumption was still wrong by 2.6x.
- 2.33 cps is far above the detection floor, so the
  order-of-magnitude branch does not apply; blip cadence goes from
  12 s to 0.43 s; instrument window [2.0e-3, 1e4] cps, 3.6 decades
  below the dead-time ceiling, +3.1 decades above the
  order-invariant floor. Fourth interest declaration: the raised
  floor makes its ordering argument much safer (0.9 decades of
  margin before); this number is not used by it to argue any shield
  thickness.
- Reproducibility defect self-reported: design_rounds.py was
  damaged on 08-08 by an index-slice edit, ~390 lines lost
  including the account-2 outputs; no git, no backup. Three
  delivered assets, two receipts and six gate scripts intact.
  Consequence: 2.33 cps is a LINEAR RESCALE of the old calibration
  point (0.08 cps @ 2.15) under a same-spectrum assumption, not a
  recomputed response chain - one grade weaker in
  reproducibility, stated as such. Integrator's addition: the
  spectrum behind 0.30 m borated concrete differs from the one
  behind an assumed 2 m of ordinary concrete, and the SiC response
  is energy-dependent, so the same-spectrum assumption is printed
  in the same sentence as the count rate.
- Pre-registration written but self-marked unqualified: its
  section 0 states it was written after the result, because
  establishing T's unit from the delivery's own relations
  unavoidably computed the magnitude; a post-hoc pre-registration
  has no binding force and is kept only to fix the reading for
  reproduction and to record why the expectation failed.
- Ruling: card, module and receipt change once to the 0.30 m
  resolved-face tier (62.5 / 2.33 cps) with the 0.282 m tier
  printed alongside, each with its condition clause; the animation
  constant follows the number (0.43 s blips - a cadence derived
  from the number that does not follow it is a card lying), with
  the constant annotated "= 1 / 2.33 cps, PREREG_perimeter_
  recompute_20260902" so the next tier change is one edit; the
  count-rate sentence carries the same-spectrum / response-not-
  recomputed caveat; the damaged ledger is an open item on its side
  (can the response chain be rebuilt from the six gate scripts and
  assets - one sentence of judgement, not now). The tokamak is
  asked to declare the bio-shield BUILD thickness (0.30 resolved /
  0.282 minimum / other with margin); until declared both tiers
  print with "build thickness not declared". environment.html line
  417 updated by the integrator with the basis and both caveats.

Build thickness declared (tokamak, SOURCE_TERM_DELIVERY.md new
section "build thickness declaration", lines 331-338; 419 lines,
gates 234): bio-shield (borated concrete) BUILD THICKNESS 0.30 m =
the resolved face, not the interpolated minimum 0.282 m. Reasons:
(1) 0.30 m is a measured face (284 records, own statistics 5.9%),
T = 1.164e-10 <= registered 1.92e-10, margin 1.65x; 0.282 m is an
interpolation between measured points, not a measured face. (2)
The 1.65x margin covers the known items: the chain's propagated
floor 2.84%; the unapplied b and the thin-zone effect both point
to "the chain over-reports T", so applying them only thins; the
local rate rises with depth, so the linear log10 T interpolation
between two measured points gives a conservative minimum. (3)
Items no thickness covers, in other ledgers: z-end leakage, duct
streaming, groundshine. (4) The thickness is the tokamak's own
design declaration (device parameters are its to set), the user
may change it; sentinel cards and environment.html print the
0.30 m tier. The sentinel's back-solved TVL 0.0953 m is received
as information only: the delivery contains no TVL or attenuation
length (its limitations section says "no fitted quantities"); the
back-solve is the sentinel's own quantity. environment.html line
417 updated to state the declared build thickness.

【扫描记录,所引旧值不作持有论(2026-09-02)】 Sentinel stop before editing account 5 (sci-rad-02/03/04): the
29x higher baseline changes a safety-critical conclusion co-signed
with sci-rad-01 and written into the tokamak's
SAFETY_REQ_sep_gating.md; it did not touch that part before a
ruling.

- Model self-checked on the old values first: baseline 0.08 cps,
  F = 1e4, hard-spectrum scaling 0.545 -> reads as x110; card says
  x112. Passes.
- Under the new baseline two conclusions move in opposite
  directions:
  ```
  F (surface enhancement)   old: reads as   new: reads as
  100                       x2.1            x1.04
  1e3                       x11.9           x1.37
  1e4                       x110            x4.7
  order-invariant margin    41x             1191x
  GCR share in the neutron channel   2.00%  0.069%
  ```
  The ordering argument gets much stronger; the "severity"
  argument for the gating requirement gets much weaker. The
  original safety-critical wording was "a large flare makes the
  perimeter column's neutron channel read as a x76 catastrophic
  fusion leak within 2 s"; under the resolved shield F = 1e4 reads
  as x4.7 - still a visible rise, no longer a catastrophic misread.
- Reported together, not only the favourable half: the same cause
  strengthens its own argument and weakens the reason it once
  demanded gating. Fifth interest declaration: the stronger
  ordering favours it, and it is the one who found the weaker
  severity; judgement handed to the integrator.
- Its own view, split: gating's necessity does not vanish (x4.7 is
  a measurable false rise, and gating depends only on two
  fractional-response ratios that do not move with the baseline);
  the basis for the "safety-critical" grade has changed (it stood
  on "catastrophic misread"); and it depends on the final shield
  thickness - at 1 m class the x112 returns. Proposal: do not
  withdraw the SAFETY_REQ; relabel "severity depends on the final
  bio-shield thickness; x4.7 at the 0.30 m resolved face, x112 at
  the 2 m self-assumed face" and grade after the thickness is
  declared. A safety item others have written into their
  requirements should not be withdrawn while its input can still
  move.
- Done so far (account 5 excluded): sci-rad-02.js blip period made
  a constant BLIP_PERIOD_S = 0.429 (= 1 / 2.33 cps), annotated with
  PREREG_perimeter_recompute_20260902 and the comparison tier
  (0.282 m face 3.84 cps -> 0.261 s), one place to change; header
  notes the old 0.08 cps / 12 s retired and why; JS syntax checked,
  old constant removed. The three cards' linked quantities listed
  (flux 2.15 -> 62.5, cps 0.08 -> 2.33, thermal/fast 0.071/0.009 ->
  2.06/0.26, ratio to GCR floor 50x -> 1456x, period 12 s -> 0.43
  s) but not written until the account-5 ruling, to avoid a mixed
  state of new baseline + old severity on the card. Nothing
  staged.

Ruling (integrator; thickness now declared 0.30 m by the tokamak,
so the "wait for declaration" branch is closed):

1. The gating requirement STAYS a safety requirement. Its mechanism
   (a flare producing a false rise in the neutron channel) is
   unchanged and its implementation depends on ratios that do not
   move with the baseline; its input, the build thickness, is a
   tokamak design declaration the user may change, and a safety
   item is not removed on a parameter that can move.
2. Its severity is regraded CONDITIONALLY and printed as a table,
   not a sentence: at the declared 0.30 m, F = 1e4 reads as x4.7
   (visible false rise, not a catastrophic misread); at a 2 m-class
   shield x112 returns. The old "x76 catastrophic within 2 s"
   wording is retired with its basis named (self-assumed 2 m
   shield). Both the ordering-margin gain (41x -> 1191x) and the
   severity loss are printed in the same block; neither alone.
3. Co-signer and holder: sci-rad-01 (co-signature) and the tokamak
   (SAFETY_REQ_sep_gating.md) update their own files with the same
   table and the same conditional clause; the integrator forwards,
   they edit only their files and report hashes.
4. Cards: proceed on the 0.30 m tier with the conditional severity
   clause; no mixed state; blip constant as done; commit with named
   paths only.
【/扫描记录】

【扫描记录,所引旧值不作持有论(2026-09-02)】 Landed (tokamak, sysdesign/SAFETY_REQ_sep_gating.md, own file
only; sha256 8e57b2c18a452908, 226 lines, retired-value gates 234
PASS): line 199 in the old "derating makes false alarms worse"
section: "severity figures in this paragraph retired 2026-09-02:
their basis was the sentinel network's self-assumed 2 m borated
concrete (0.08 cps baseline); severity under the resolved shield
in the conditional table below. The gating requirement itself is
unchanged." Lines 205-226 new section "severity as a conditional
table (2026-09-02, sentinel recompute on the resolved shield;
sci-rad-01 co-signed; integrator's ruling)": gating kept as a
safety requirement (mechanism unchanged, implementation
baseline-independent, thickness a moving parameter); old-value
self-check line (0.08 cps, F = 1e4, 0.545 -> x110, card x112);
table - 0.30 m (declared build thickness, baseline 2.33 cps): F =
1e2/1e3/1e4 -> x1.04 / x1.37 / x4.7, visible false rise, not a
catastrophic misread; 2 m class (old self-assumed, 0.08 cps) ->
x2.1 / x11.9 / x112, the "x76 / x112 catastrophic" sentence
retired with its basis named; ordering margin 41x -> 1191x and
GCR share 2.00% -> 0.069% printed in the same block and marked as
sharing one cause; closing line "numbers computed by the sentinel
network, co-signed by sci-rad-01, forwarded under the
integrator's ruling; this ledger reprints as ruled and does not
recompute; if the build thickness changes this table is
reprinted."
【/扫描记录】

Co-signer's update (sci-rad-01, its commit e2661e2); no objection
to "kept as a safety requirement"; three additions not asked for,
all adopted and forwarded to the SAFETY_REQ holder and the
sentinel:

- The 62.5 is its own number walked once more: escape 1.164e-10 ->
  leakage 2.643e10 n/s -> 62.53 n cm^-2 s^-1 at 58 m, reproduced
  to 0.05%. Not two independent sources agreeing - one number
  taken twice; written beside the table, otherwise it reads as
  cross-validation.
- Reason "kept" can be checked by others: the severity is
  conditional on a build parameter; a requirement whose severity a
  parameter change can restore is not deleted while the parameter
  is currently favourable.
- (1) 62.5 inherits every qualifier of 1.164e-10: b unapplied
  (applying lowers it), h(E) reproduced from background knowledge,
  S_n copied not verified, pure Poisson unmeasured and unmeasurable
  on the current binary, N_eff capped at 1,238, and the project has
  no sourced concrete attenuation reference. A safety severity
  table now stands on these; they go on the same page as the
  table. (2) Every item in this change moved in the favourable
  direction and the driving number is sci-rad-01's own, so its
  consent is not a neutral second opinion - written beside the
  consent, otherwise the co-signature reads as two independent
  confirmations. (3) Re-trigger condition registered: build
  thickness departs from 0.30 m, or the station's escape value is
  revised => the table is void and must be recomputed; the holder
  of the build declaration notifies on a thickness change. Without
  it the conditional table reads as a conclusion table.
- The FLAG-not-SUBTRACT half is unaffected and not lessened: it
  guards against subtracting a modelled SEP contribution hiding
  real leakage during the event, independent of background level -
  a lower background leaves the same absolute over-subtraction
  hiding the same absolute leakage. Gain in the table, weakening in
  this sentence, same block.
- The old "x76 catastrophic" retired with basis named: computed on
  a 2 m shield background, a thickness never built and never
  checked by the station or anyone.

Landed (tokamak, SAFETY_REQ_sep_gating.md lines 227-246, same page
as the conditional table, right after "reprinted if the thickness
changes"; sha256 ccb2cec0f3a785f3, 246 lines, gates 234): (1) the
baseline is not two independent sources - 62.5 is 1.164e-10
walked once more, reproduced to 0.05%; (2) every qualifier of
1.164e-10, none omissible: b unapplied; h(E) reproduced from
background knowledge; S_n = P_fus / E_DT with P_fus copied from
v5_operating_point.json and not re-verified; pure Poisson
unmeasured and unmeasurable on the current binary; N_eff capped
at 1,238 so downstream >= 2.84%; no sourced concrete attenuation
reference in the project; (3) nature of the co-signature: every
item moved favourably, the driving number is sci-rad-01's reading
product, its consent is not a neutral second opinion; (4)
re-trigger condition registered: build thickness departs from
0.30 m or the escape value 1.164e-10 is revised => table void,
recompute; the duty to notify is the tokamak's (holder of the
build declaration), which informs the sentinel network and
sci-rad-01 on a thickness change rather than waiting for them to
notice; (5) FLAG-not-SUBTRACT unaffected and not lessened; a
smaller severity changes the misread magnitude, not the
disposition.

Integrator's record of a repository incident, same hour: the
sci-weather-01 accuracy-account commit 49110f8 staged CHECKLIST.md
whole and so carried the hab-village-01 row (line 119) and the
magic-city row (line 147), neither its own; the village has not
declared delivery and its other three files remain uncommitted.
The integrator's attempt to restore the village row by a reverse
hunk was blocked by its own run environment and did not execute;
the index is untouched. The restore is handed to the user to run
outside this session.

Sentinel re-anchoring landed (sci-rad-02/03/04, commit ab79f31,
five own files only: RECEIPT_sci-rad-02_tokamak_v5.md, the three
cards, sci-rad-02.js; CHECKLIST untouched):

- (1) three cards and the receipt on the 0.30 m build-thickness
  tier: 62.5 n cm^-2 s^-1 +-3.3% / 2.32 cps; the 0.282 m tier
  (103.1 / 3.82 cps) printed as comparison and marked
  "interpolated minimum, not the build thickness"; both tiers with
  their condition clauses; "build thickness not declared" removed.
  (2) BLIP_PERIOD_S = 0.432 (= 1 / 2.32 cps), source
  PREREG_perimeter_recompute_20260902, comparison tier 0.261 s
  noted, one place to change. (4) pre-registration marked
  post-hoc. (5) TVL back-solve 0.0953 m marked "this network's own
  back-solve; the delivery contains no fitted quantity", fourth and
  fifth interest declarations entered.
- Correction of its own earlier understatement (overstating a
  weakness is also inaccurate): what the 08-08 damage lost was
  account 2's output keys and methodology prose; the response-chain
  code (A_pad / eff_fast / f_moderated / EFF_TH) is intact and
  computed 2.32 cps directly, consistent with the linear rescale
  2.33 - mutual check. The qualifier is therefore not "function
  unavailable" but "function usable, its two spectral parameters
  calibrated on another spectrum": f_moderated = 0.35 and eff_fast
  = 0.002 were calibrated behind the self-assumed 2 m ordinary
  concrete; the spectrum behind 0.30 m borated concrete differs and
  the SiC response is energy-dependent. Names the two parameters to
  re-calibrate. environment.html line 417 rewritten to this form
  (2.32 / 3.82, parameters named). Account 2 output keys rebuilt as
  RESOLVED_*; the ~40 sections of lost prose are not rebuilt from
  memory as if original - open item on its side.
- Cross-ledger alignment failure: account 5's
  response_ratio_range moved 22-90x -> 645-2630x while sci-rad-01's
  side still holds the old interval; the failure is a one-sided
  re-anchoring, not an error; the mismatch is written into the
  field and the clause "difference only from cps rounding" removed
  (a dead alignment leaves it a subjectless endorsement). Until
  sci-rad-01 recomputes on the new baseline the field is not
  cross-confirmation. Forwarded to sci-rad-01.
- Gating grade: its card prints necessity unchanged and the grade's
  premise gone (x112 retired -> x4.8), "not changed unilaterally";
  the ruling (kept, conditional severity) had been sent and is
  restated to it. Number alignment: SAFETY_REQ prints x4.7 (from
  the 2.33 rescale), the sentinel's direct computation gives x4.8
  (from 2.32); the sentinel is the computing party and is asked for
  the final three-row table on the 2.32 baseline, to be reprinted
  identically by the tokamak and sci-rad-01.
- Gates: six PASS; check_retired registers five retired values
  (0.08 cps / 2.15 / 12 s / x112 / 39x); selftest_retired red 24,
  green 10, invalid 0, blind 0, false-red 0; meta_selftest 7/7
  blinded, 3/3 benign. Two own misses caught by gates: the specs
  table on the card was not updated with the sim text ("changed
  the text, missed the container"); a regression fixture loaded
  with "current value 0.08 cps" became a false red after
  re-anchoring - fixtures loaded with a current value must move
  with the anchor.

【扫描记录,所引旧值不作持有论(2026-09-02)】 Sentinel account-5 card landed (3aa26e4, sci-rad-02.info.json
only, +4/-2): the integrator's instruction to add "response chain
not recomputed" was NOT followed - correctly: that sentence had
already been corrected (messages crossed); copying it would pin a
withdrawn self-deprecation back onto the card; the instruction is
withdrawn. Card prints the corrected form (chain intact, two
spectral parameters calibrated on another spectrum) and says the
earlier statement to the integrator understated it. Conditional
table as a table: (1) declared 0.30 m: F = 1e4 -> x4.8, visible
false rise, not catastrophic; (2) 2 m class: x112 returns (retired;
basis self-assumed, not any declaration). Ordering margin 39x
(retired) -> 1171x and severity x112 (retired) -> x4.8 in one
block, "same cause, opposite consequences, neither half alone".
Co-signer's four points on the same page. Its own numbers x4.8 and
39x -> 1171x differ from the integrator's relayed x4.7 and 41x ->
1191x only by R_gcr taken as 0.0016 vs 0.00162; printed with the
difference stated, not hidden and not left as two circulating
versions. Ruling: the computing party's numbers govern; the
tokamak's SAFETY_REQ and sci-rad-01's co-signature reprint x4.8
and 39x -> 1171x with a note on the earlier rounding; 2.33 -> 2.32
(chain-computed, rescale as cross-check). Its reading of the
ruling: when a requirement's grade depends on a variable input,
write the dependence as a conditional table rather than wait for
the input to settle - waiting only defers the same error to the
next change. Open item for the user: the ~40 lost prose sections
are not rebuilt from memory as originals; whether to write a new
document dated 2026-09-02 and marked "rewritten, not original" is
the user's call.
【/扫描记录】

Reprint landed (tokamak, SAFETY_REQ_sep_gating.md; sha256
ea82778917c75859, 246 lines, gates 234): line 212 baseline 2.32
cps (chain-computed; rescale 2.33 as cross-check); line 216
conditional-table 0.30 m row x4.8 with the note "earlier x4.7 was
the integrator's relayed value from R_gcr rounded to 0.0016; the
sentinel ledger 3aa26e4 value 0.00162 governs"; line 220 ordering
margin 39x -> 1171x, same note; line 222 same-cause sentence
baseline 2.32; line 239 co-signature sentence "x112 -> x4.8, 39x
-> 1171x". No residual x4.7 / 1191x / 2.33 cps outside the notes.

sci-rad-01 recomputation on the new baseline (its commit 25130fa):
response_ratio_range_x = [652, 2661], GCR share 0.07%, margin
652x, neutron channel moves 0.08% when the charged channel reaches
the 3x gate (old 0.92%). Its first reading "the two intervals now
nearly coincide by chance" withdrawn: the sentinel went 22 -> 645
(x29 from 0.08), it went 53 -> 652 (x12 from 0.19) - different
factors, one endpoint, because both now sit on the same baseline:
alignment restored, not coincidence. Which exposes that the
alignment was already broken before today: its ledger cited the
sentinel's old baseline as 0.19 cps while the sentinel calls the
old value 0.08; if 0.08 was a later revision, its published [53,
218] was wrong from that revision on and today is the second
re-anchoring, not the first - undecidable on its side, asked, not
assumed (forwarded to the sentinel: when was 0.08 set, was it
published without being followed). Its own note above the
constant said "if they revise again, this line and everything
below must be recomputed" - a re-trigger condition nobody polls is
a comment; a dependency that stays declared behaves like a
satisfied one. The number lived in five places (account-6
constant, delivered card x12 replacements, local card copy synced
from the delivery as authority, the gate's own expectation table
pinned to the old literal, README index); one retired value
(60-250, "hand-rounded restatement") survived in its receipt
because the ban governed cards and nothing governed receipts. The
gate then flagged its own retraction note in the README: fix is
not an exception - README is a current-state index, receipts are
history; retired numbers belong to the latter. Severity table: it
waits for the sentinel's final numbers and reprints on one
baseline, never between two. Remaining difference between [652,
2661] and the sentinel's 645-2630 expected to be R_gcr 0.0016 vs
0.00162; the sentinel is asked to confirm the constant so both
sides print one interval.

sci-rad-01 co-signature reprinted (its commit 061c638): 2.33 ->
2.32 (2.33 noted as the linear rescale, cross-check only - a
cross-check value is not taken as the original when the original
is available), x4.7 -> x4.8, 41x -> 1191x replaced by 39x ->
1171x; its own account 5/6 side response_ratio_range_x = [652,
2661] (old [53, 218]), GCR share 0.07%. Its arithmetic on the
last digit: baseline 2.33 cps -> pedestal x29.12 -> F = 1e4 gives
x4.74; baseline 2.32 -> x29.00 -> x4.76 - the printed-digit flip
is the baseline's last digit, consistent with the R_gcr-rounding
note. One block-level trap it marked: two quantities both called
"margin" coexist in the co-signed block and are not the same -
ordering margin (sentinel account 5) 39x -> 1171x, and
margin_factor_in_that_parameter (sci-rad-01 account 6 = 45%
critical share / current share) 53x -> 652x. Unlabelled, the next
reader sees an inconsistency and picks one, and which one is
never recorded - the way "same name, different quantity" fails in
a multi-party document, this time with both numbers right. The
tokamak is asked to tabulate both in the SAFETY_REQ block. The
0.08 vs 0.19 cps old-baseline question stands with the sentinel.

Computing party's final severity table (sentinel, commit a46cecf,
sci-rad-02.info.json only, +2/-2), baseline R_leak = 2.317 cps
(resolved, 0.30 m build thickness):

| F | charged channel cps | charged 5 sigma | neutron rise | reads as | neutron 5 sigma |
|---|---|---|---|---|---|
| 1e2 | 0.40 -> 40.0 | 1 s | 3.8% | x1.0 | 2.2 h |
| 1e3 | 0.40 -> 400.0 | < 1 s | 38.0% | x1.4 | 103 s |
| 1e4 | 0.40 -> 4000.0 | < 1 s | 380.2% | x4.8 | 4 s |

Ordering invariant: R_gcr (s_max - 1) = 0.00162 x (2.223 - 1) =
0.00198 cps => margin 1171x (old 39x, self-assumed 2 m tier,
retired). Formula published for independent recomputation, not
copying: reads-as = 1 + (F s - 1) R_gcr / R_leak, s = 0.545 (gamma
= 1.5 hard-spectrum scaling); per-cell self-check 1.037 / 1.376 /
4.763 (with R_gcr 0.0016). Integrator's note: the per-cell check
uses 0.0016 while the invariant uses 0.00162 (4.763 vs 4.810, both
print x4.8); the sentinel is asked to state one constant so the
table and the invariant share it. F = 1e2 was not in its tiers
(2/10/50/1e3/1e4); it added the tier to the ledger and reran
rather than hand-computing a cell - a published table must be
recomputable from the publisher's own ledger. Adding the tier
exposed a defect caught by the prose-table consistency gate: a
prose sentence took the worst tier by position (sep_rows[4]) and
silently described another row after the list grew; changed to
selection by F value. Rule: "max / worst / last tier" references
by value, never by position - same family as its 08-08 index-slice
damage. Card grading sentence per the ruling ("kept as a safety
requirement; a safety item is not withdrawn on a moving
parameter"). Lost prose: it advises against a "rewritten" edition
(it would look like a ledger and be a restatement - the very thing
repaired all day); if the user wants one, every section marked
"rewritten after the fact, not original, not citable as source",
not only the file header, since a header note does not travel
with an excerpted section. Tokamak and sci-rad-01 asked to
recompute the three cells and the invariant from the formula and
report agreement or the differing step, not edit in place.

Two-margins table landed (tokamak, SAFETY_REQ_sep_gating.md lines
224-229, after the same-cause sentence; 254 lines, sha256
3c4c9f4c37ea2ea3, gates 234): ordering margin (sentinel account
5, charged channel triggers before the neutron channel) 39x ->
1171x; margin_factor_in_that_parameter (sci-rad-01 account 6, 45%
critical share / current GCR share) 53x -> 652x; preceded by "two
quantities both called margin, not the same; unlabelled the next
reader sees an inconsistency and picks one".

Tokamak's independent recomputation of the sentinel table (not
copied): printed numbers agree with its lines 216/220; two
0.2%-level internal inconsistencies reported back, not edited in
place. Cells: R_gcr 0.00162 gives 1.037 / 1.380 / 4.810, 0.0016
gives 1.037 / 1.376 / 4.763 - x1.0 / x1.4 / x4.8 under both.
Invariant: 0.00162 x 1.223 = 0.001981 cps, 2.317 / 0.001981 =
1169x; the printed 1171x corresponds to R_leak = 2.32. The
neutron-channel rise 380.2% is reproduced by neither constant
(376.3% / 381.0%); it corresponds to R_leak 2.322 or R_gcr
0.001617 - R_leak is not unified between 2.317 and 2.32 inside the
table, same root as the 1171x. Charged channel 40 / 400 / 4000
cps agrees. Neutron 5 sigma times with the raised total rate as
variance, t = 25 (1 + r) / (r^2 R_leak): 2.15 h / 103 s / 3.6 s,
agreeing with 2.2 h / 103 s / 4 s (its own first pass used the
baseline alone as variance, 2.08 h / 75 s / 0.7 s - missed
(1 + r), its slip, corrected). Sentinel asked to unify R_leak and
R_gcr to one source value each, rerun table and invariant, and
report whether any printed number moves (1171x -> 1169x would
propagate to the tokamak and sci-rad-01).

sci-rad-01's independent recomputation (formula, not copied):
3.7% / x1.04, 38.0% / x1.38, 381.0% / x4.81, invariant 0.00198,
margin 1169x at full precision - agrees; the last-digit difference
is rounding; it takes the sentinel's 1171x and notes "independent
recomputation 1169 (rounding)", so a future 1169 is not mistaken
for an inconsistency. A reading problem the table does not state:
F prints freely while s is silently pinned to the hard branch
0.545; its account-6 scaling values are 0.545 / 0.644 / 2.223 (s
larger = softer), and the same F = 1e4 on the soft branch gives
x16.5 - 3.4x apart. Not necessarily wrong (F = 1e4 is a hard-event
magnitude, pairing it with the soft response is a mismatch, and
the card already says the overshoot lives only in the soft
spectrum whose absolute rise is negligible), but the table does
not say so and nothing in a row stops a reader from applying it
to a soft event. Ruling: numbers unchanged, header clause added:
"computed along the hard-spectrum branch (s = 0.545); F and s
must be taken from the same branch; the soft branch gives x16.5
for the same F, and soft-spectrum events do not reach that F" -
sent to the sentinel (table owner) and the tokamak (SAFETY_REQ).
Its pre-announced edit list was incomplete: R_gcr 0.0016 ->
0.00162 and R_leak 2.32 -> 2.317 both move, in opposite
directions on the share ([652, 2661] -> [644, 2628] -> [643,
2624]); applying either alone would leave a state that looks
converged and is half-done; it caught this only because the
integrator mentioned the second constant - the completeness of a
pre-announced edit list is itself something to check. It waits
for the sentinel to fix both constants, then edits once.
sci-weather-01 anchored 887011d (1ee1379) and declined to write
"budget 1.9 K" because no in-repo anchor carries that number -
the red line held; thz asked to land its representativeness table
on its card so consumers can cite it.

Header clause landed (tokamak, SAFETY_REQ_sep_gating.md lines
214-215 above the conditional table; line 223 adds "our own
independent recomputation 1169x, difference is R_leak 2.317/2.32
rounding"; table numbers untouched; 257 lines, sha256
b52975905b3fa60a, gates 234).

【扫描记录,所引旧值不作持有论(2026-09-02)】 Sentinel answers the two questions (its own defect found on the
way):

- R_gcr: its ledger's R_n_gcr is the computed 0.05 x (2 A eff_fast
  + 2 A EFF_TH x 0.3) = 0.001616, while the published key
  gcr_ambient_cps was hand-typed 0.0016 - a published constant not
  derived from the computation, the day's disease on its own side,
  and the source of the x4.7 / x4.8 and 41x / 1191x split. Three
  layers of single-sourcing done (six gates green, not yet
  committed): GCR_N_SURFACE_CPS one definition shared by accounts
  2 and 3; LEAK_OVER_GCR computed once and shared (prose used the
  raw value, the published key the rounded one, differing by 1);
  the gate reads the published derived key instead of recomputing
  (else the gate is a second source). Ruled: R_gcr = 0.001616 on
  both sides, not 0.0016 and not a midpoint; the sentinel states
  the final pair (R_gcr, R_leak) with its commit so sci-rad-01
  edits once. Current values: ordering margin 1171x; ratio to the
  GCR ambient floor 1433x (1448 had used the hand-typed 0.0016);
  F = 1e2 / 1e3 / 1e4 -> x1.0 / x1.4 / x4.8. The tokamak is asked
  to grep 1448 / 0.0016 in the SAFETY_REQ. Its endorsement of "same
  endpoint from different factors = alignment restored": two paths
  from different starting points through different factors landing
  on one value is corroboration; identical numbers from identical
  starting points are only reproduction.
- 0.19 -> 0.08 cps: set 2026-08-31, commit 30cedc4 ("sep chain:
  rebuilt on the v5 source term, and the fence count fell by
  half") - source term rebuilt on tokamak v5 640 MW (S_n 3.01e20
  -> 2.27e20) and withdrawal of the mislabel that took 1.9e14 as a
  shield-exit flux. No record of notifying sci-rad-01 (the 0.19 ->
  0.08 table sat in a receipt to com-gap). So sci-rad-01's
  published [53, 218] has been invalid since 08-31 and today is the
  second re-anchoring; the sentinel owns the missed notification.
- Read-only scan of mars_rad against its retired-value table
  (nothing changed): sim/06_sep_secondary_neutrons.py holds 0.21
  cps (an even older basis), sim/08_village_criterion.py holds
  6.2 mSv/yr, dev/RECEIPT_comgap.md holds 0.08 cps and 6.2 mSv/yr.
  None of these are its products, so its six gates cannot see
  them; its ADVISORY channel covered only external pages citing
  its ledger, and this is the other class: someone else's product
  carrying its number, circulating under their name. Ruled: it
  does not edit others' ledgers and does not judge them FAIL; a
  periodic read-only ADVISORY "who still holds my old values" is
  approved as its standing practice after every re-anchoring,
  reporting hits to the holders and the integrator - the sender is
  the only party positioned to detect a missed notification. Rule
  for the city: changing a number others have cited means going
  to count who still holds the old one, not updating one's own
  products; one's own products have gates, the copies in others'
  hands have nothing. The three hits forwarded to sci-rad-01 for
  its own judgement.
- Tokamak grep: no "1448" as a margin anywhere (the only hit is a
  hash string in a test file); the hand-typed 0.0016 appeared only
  in the SAFETY_REQ line-219 note, now reading "earlier x4.7 came
  from the relayed hand-typed published key 0.0016; R_gcr single-
  sourced to the ledger's computed 0.001616, unified on both sides;
  printed numbers unchanged". 257 lines, sha256 ad5a82f642b57bcf,
  gates 234.
- sci-rad-01 disposed of the three hits (its commit 5097e82),
  each differently because they are not one kind: sim/06's 0.21
  sat in a present-tense derivation ("only if scaling > 0.21/0.0016
  = 131") while the code computes ~1450 from constants - a second
  implementation written in English, diverging from the code;
  rewritten to derive from the constants with no literal. sim/08's
  6.2 was correct inside a SUPERSEDED key but the paragraph quoting
  the sentinel's card was in the present tense - quoting someone
  else's card in the present tense freezes it at the moment of
  quotation, which is not the quoter's to do; marked SUPERSEDED
  pointing to the current key. RECEIPT_comgap.md keeps 6.2 and
  0.08 (receipts are history) with forward pointers at the
  superseded assertions, since a reader lands mid-document and
  never sees the later correction; the "0.08 (their stated OLD)"
  entry already carried its mark. It enters the 08-31 finding as
  the heavier branch: [53, 218] invalid since then, second
  re-anchoring today; the notification failure and its own zero
  polling happened together, and either alone would have
  prevented the error; the mechanism now exists on the sentinel's
  side and is recorded as built there. It still waits for the
  final pair (0.001616 differs from its trial 0.00162 by one digit
  and moves the interval again).
【/扫描记录】

Sentinel unification complete (commit eeca5b1, sci-rad-02 card
only, +8/-6). The 1169 / 1171 difference was not rounding but one
name with two meanings: its ledger called both the pedestal total
(2.3165 cps, the denominator of the table's rise and reads-as) and
the fusion component (2.3149 cps = total minus the GCR share, the
numerator of the ordering invariant) R_leak; they differ by
0.070%; the tokamak took the total (1169x), the sentinel the
fusion component (1171x), neither wrong. Renamed
R_pedestal_total_cps / R_leak_fusion_cps and the invariant string
states "numerator is the fusion component, not the total (which
gives 1172x)". One name, two meanings is harder to find than a
numeric split because both sides are self-consistent. Final
constant pair for both sides: R_gcr = 0.001616 (computed, not
hand-typed 0.0016, no midpoint); R_pedestal_total = 2.3165 cps;
R_leak_fusion = 2.3149 cps; threshold 0.001977 cps. Printed
numbers unchanged: ordering margin 1171x, ratio to GCR ambient
floor 1433x, F = 1e2 / 1e3 / 1e4 -> x1.0 / x1.4 / x4.8 (rise 3.8%
/ 38.0% / 380.2%; 0.001616 reproduces 380.2% exactly - the
tokamak's 0.0016 and 0.00162 were two roundings of the hand-typed
value). Header clause added as ruled with its reason ("the
table's columns are variables, and so is the one not written").
Two gate defects exposed during the fix: the gate was recomputing
a published derived quantity (two computations differing by 1) -
now reads the published key, else the gate is a second source;
and the gate extracted values from the checked string with
re.findall and compared - validating the string with itself, and
an IndexError on a one-decimal change - now each key quantity is
published as an independent field and the gate compares fields.
Periodic ADVISORY accepted. Forwarded: the pair to sci-rad-01 for
its single edit; the name split to the tokamak for line 223.
Landed (tokamak, SAFETY_REQ line 223: "rounding" withdrawn, the
two named quantities and the final constant pair stated; line 219
note adds "the 380.2% rise is given exactly by 0.001616", its own
earlier trial constants recorded as its recomputation error, not
the sentinel's; printed numbers unchanged; 257 lines, sha256
309543b672610e73, gates 234).

sci-rad-01 single edit done (its commit 4fa854a; mars card
committed by the integrator, 2 lines): roles read by formula, not
by name - its GCR_SHARE_N divides by the pedestal total (2.3165),
LEAK_NOW = TOTAL - GCR derives the fusion component 2.314884,
matching 2.3149. Applied end to end: R_gcr 0.001616 / total
2.3165 / fusion 2.3149 / threshold 0.001977; share 0.07%;
response_ratio_range_x [645, 2630] - exactly the sentinel's
645-2630 this time; margin_factor 645; rise at gate open 0.08%
hard / 0.31% soft; account 6, three derived items, card zh/en,
README, gate expectations, retired-value table, external-constant
register (marked confirmed 2026-09-02, self-expiring to red after
seven days without anyone deciding to look). Two corrections it
owes: "the last-digit difference is rounding" was wrong - it was
the one-name-two-meanings collision; rounding is the cheapest
mechanism, predicts a small difference, and any small difference
confirms it - "it's just rounding" is a hypothesis, not an
observation, and the easiest one to accept unchecked; it had
labelled two "margins" on the same page and then dismissed its
own third collision as rounding. And its commit 3728e9f's message
claimed "rounding explanation withdrawn" while the edit's anchor
had not matched and nothing was written - a commit message
asserting an edit that did not land; written in 4fa854a with the
incident recorded there.

【扫描记录,所引旧值不作持有论(2026-09-02)】 First ADVISORY after the re-anchoring (sentinel, script
mars_rad_sic/advisory_who_holds_my_retired.py, not a one-off grep;
262 files scanned against the 17-entry retired table, single
source). Hits, forwarded to the holders for their own judgement
(a hit is not an error; history may legitimately hold old values):
sci-rad-01 - dev/RECEIPT_comgap.md:847 village residual 6.2 (now
7.6), :10048 fence count 0.08 (now 2.32), sim/08_village_
criterion.py:20 residual 6.2; tokamak - SAFETY_REQ_sep_gating.md:62
fence count 0.08, :249 old ordering margin, NOTES_pending_
disclosures.md:43 old ordering margin, TVL_measurements.md:121
"two effects same direction" (withdrawn; direction undetermined),
:134 thickness-estimate precision statement (withdrawn). The
holders' own gate and self-test files were filtered out (they
carry retired values by design; a red there is self-reference,
and a list the recipient recognises as noise gets the next list
ignored). Blind spots stated in the file header: only registered
retired values; only the three listed ledgers, new ledgers do not
enter by themselves (the hand-enumeration hole, unsolved and not
pretended otherwise); a rewording bypasses it. Self-report: to
prove the script read-only it compared directory fingerprints
before and after; the fingerprint changed and it briefly judged
itself "modified" - dev/RECEIPT_comgap.md had been written 40 s
earlier by sci-rad-01; in a live multi-session environment
before/after equality cannot prove read-only and its false
direction is self-accusation; replaced by a static proof (AST scan,
zero write/delete/exec calls). Cross-ledger script always exits 0.
Ruled: commit the script with this round's changes; whether the
ledger list should be fed from the city manifest is the user's.

Holders' dispositions: sci-rad-01 checked, not recalled - all
three hits already carried the forward pointer (RECEIPT 868), the
"(their stated OLD)" mark, or the SUPERSEDED note (sim/08); its
line numbers had moved by ~17 lines since the scan because it
appended to the receipt afterwards - a cross-session list keyed by
line number aims at a moving target; use match string + context
or stamp "line numbers as of scan time"; and the scan did NOT
report its "6.2x10^5 hit/s" (a hit rate, not a dose), evidence of
context-aware matching, named because a bare-number scan would
have flagged it and such false hits train holders to ignore the
list. Tokamak disposed of five: three changed with pointers
(SAFETY_REQ line 62 historical paragraph -> pointer at 64-65 to
the conditional-table section, sha256 bbab9be3c3292158;
TVL_measurements line 121 "consistent with the prediction that
deeper spectral hardening lengthens the attenuation length" ->
withdrawn pointer at 122-124: direction undetermined, and the
probe family and c5 sequence measured the rate RISING with depth,
7.47 -> 11.25 decades/m, moderation into the absorber, i.e. the
attenuation length shortens - opposite; line 134 "single-TVL
estimate ~30% precision" -> withdrawn pointer at 137-139: no TVL
in the delivery, thickness from measured-point interpolation;
sha256 fcc94765f55cdb14); two kept with reasons (line 249 is an
old -> new comparison sentence with the current value in the same
sentence; NOTES_pending_disclosures line 43 is the reprint log
entry).

Sentinel: no hash to report for its side - mars_rad_sic is not a
git repository ("fatal: not a git repository"); this round's eight
files there (the ADVISORY script, design_rounds.py with the
single-sourcing, name split and independent published fields,
three gates, selftest_retired, README, the pre-registration) are
under no version control. Its mars-side files are all committed
(ab79f31 / 3aa26e4 / a46cecf / eeca5b1). This is the same
condition that made the 08-08 loss of ~390 lines unrecoverable
(no git, no backup), unchanged, and this round edited the ledger
and three gates in that same directory. It does not git init on
its own - a repository changes the user's project layout, which is
the user's, not the ledger's; reported to the user as a pending
decision, with the minimal form it recommends: a separate git init
in mars_rad_sic (not merged into mars, to keep the two histories
apart), first commit takes the current state, thereafter commits
in step with the mars side, no remote push. Interim: a copy of the
directory in its session temp area, stated as NOT a backup (dies
with the session, not on a user-visible path), covering only the
window until the user answers. The integrator concurs with the
recommendation and raises it to the user as today's heaviest open
decision. Approved on its own script: a WARN line when the number
of scanned ledgers is below the declared count (the missing-ledger
failure is silent - "262 files scanned" looks normal), and match
string + context in place of line numbers.
【/扫描记录】

【扫描记录,所引旧值不作持有论(2026-09-02)】 ADVISORY refined (sentinel; still no hash, mars_rad_sic
unversioned, re-snapshotted before editing): switching to match
string + context showed 3 of the 8 hits were the holders' own
disposal traces ("SUPERSEDED VERSION OF THEIR", "0.08 cps (their
stated OLD)", "margin 39x -> 1171x (earlier 41x -> 1191x)") - its
exemption vocabulary had recognised only its own wording; the
holders' conventions added (SUPERSEDED / stated OLD / 先前 / 已撤
/ deprecated / replaced by ...), hits 8 -> 4. Its rule for the
day: a cross-ledger scan must recognise the holders' withdrawal
conventions, not its own, or the list is full of things already
done and the noise trains holders to ignore the next one - the
one way this channel really fails. Asymmetry written into the
file header: ADVISORY exemptions may be wider than a gate's,
because the error costs differ - a gate's false pass leaves an old
value alive in one's own product (strict), an ADVISORY false hit
spends the holder's trust while a miss is caught next round
(periodic). Line numbers demoted to "as of scan time, may have
moved". The unreported "6.2x10^5 hit/s" was design, not luck: the
6.2 probe carries context qualifiers (village / regolith /
residual / denominator), the product of the earlier "over-broad
probes force gates loose" round. Final list of 4 forwarded:
sci-rad-01 RECEIPT_comgap.md village residual 6.2 and fence count
0.08 (likely the already-pointered places - "前向指针" may be
missing from the vocabulary); tokamak SAFETY_REQ 0.21 cps (a value
from two re-anchorings back, new hit) and the 39x transition row
(disposable). WARN added: "coverage incomplete, not to be read as
nobody holds old values" when fewer ledgers than declared.
Tokamak: the 0.21 cps sits only at line 62, the paragraph already
carrying the historical pointer at 64-65 covering the whole
re-anchoring chain 0.21 -> 2.3165; no further change, sha256
unchanged bbab9be3c3292158; the 39x row skipped as a transition
record.
【/扫描记录】

【扫描记录,所引旧值不作持有论(2026-09-02)】
sci-rad-01 on the refined list (its commit cce422b): not the same
places - it nearly answered "same, disposed" and checked instead.
864/866 (6.2): the forward pointer sits at 868, two to four lines
below - a window-width matter, not a vocabulary one. 10065 (0.08)
carries "(their stated OLD)" and should already be recognised.
1373 (6.20 -> 7.59) and 10127 (0.19 -> 0.08): places it had not
known about - its earlier "the three are the three, nothing
missed" was wrong; a check whose scope is drawn by memory
verifies the memory. Those two are transition records, not stale
holdings: they carry the old value because they state the change,
and under a vocabulary scan the two kinds look identical. Its
discriminator, mechanical and convention-free: a transition
record contains both the old and the current value; a stale
holding contains only the old - "current value present => pass".
Its own gap: 10127 "0.19 -> 0.08" holds two retired values with
the current 2.32 absent, which the discriminator cannot catch;
fixed by making the line self-describing ("both retired; the
current pedestal total is 2.3165 cps"). Recommendation against
adding "前向指针" to the vocabulary as the fix: the 864 miss is
window width, and widening the window brings the false positives
back - keep the window narrow and use "current value present".
The sentinel's scan did not report line 6437 (r = 6.235 next to
"mSv"), which sci-rad-01's own ad-hoc checker did report - the
scan is better than the checker written to check it. Forwarded to
the sentinel to install the discriminator with the vocabulary as
a supplement.
【/扫描记录】

Open cross-ledger disagreement, village in-cabin dose (raised
2026-09-02 while res-glass-01 disposed of an ADVISORY hit; recorded
here because the village receptor criterion in this document rests
on the same regolith model; ruled by the integrator as the
non-benefiting reviewer):

- The quantity in dispute, written comparably: the attenuation
  factor of 2 m (330 g/cm2) of regolith for the GCR dose. The
  village model (parameters supplied by the hab-village-01 berm
  card and published through the integrator: f_n = 0.10, lambda_p
  = 67.1 g/cm2, lambda_n = 170 g/cm2, saturated build-up B = 1.8;
  234 x [(1 - f_n) exp(-330/67.1) + f_n B exp(-330/170)] = 7.586
  mSv/yr) gives 31x. res-glass-01's account 16 (Geant4 11.2.2
  Shielding, full transport including secondaries produced inside
  the regolith by GCR primaries; protons only, Usoskin LIS at phi =
  0.65 GV, no alpha / HZE, absorbed dose short by 20-40%) gives
  5.7x between its bare-surface and 2 m cases (lambda_eff = 183
  g/cm2), i.e. ~41 mSv/yr in-cabin if scaled from the same 234.
- Basis check: 234 mSv/yr is dose EQUIVALENT (sci-rad-01 account 1,
  RAD anchor: D_abs 0.210 mGy/day, H_eq 0.64 mSv/day, <Q> = 3.05,
  source Hassler 2014 / Guo 2018, marked "reproduced from
  background knowledge, original not re-read"); glass's 0.154
  mGy/day is ABSORBED, protons only. The dimensional correction
  widens the gap in both directions sci-rad-01 could compute:
  behind 2 m the field is neutron-dominated and Q rises with
  depth, so the equivalent-dose factor should be SMALLER than the
  absorbed one, yet 31x (equivalent) exceeds 5.7x (absorbed);
  adding alpha / HZE lifts 5.7 only to 7.1-9.5. Converting the
  village model's f_n from equivalent to absorbed (Q_n 6-10, Q_c
  1.5-2) gives f_n,abs 0.016-0.036 and a factor of 63-89x. Ruling:
  the disagreement is at the level of the model, not the units;
  no further search along dimensions.
- Internal inconsistency in the village model found on the way: at
  t = 0 the bracket (1 - f_n) + f_n B = 1.08, so the curve gives
  252.7 at zero thickness, not the published 234 - build-up
  applied at zero thickness must be 1; an 8% offset, not the cause
  of the gap, but a checkable error for the owner.
- Discriminator (sci-rad-01, adopted): read glass's Geant4
  dose-depth curve near 2 m - a floor that thickness cannot push
  down means secondary production inside the shield dominates and
  the two models compute different quantities; a still-exponential
  fall means one quantity and a real ~5-16x error on one side.
  glass has no such curve yet (only 0 m and 2 m plus a
  raised-floor case); a 1.0 / 1.5 / 2.0 / 2.5 / 3.0 m scan is
  running on its VM. Directional evidence so far, not a verdict:
  glass's case E (soil under the cabin floor thickened 1 -> 3 m)
  RAISED the cabin-centre dose 1.5x - a system in which thicker
  shielding raises the dose is not what any 31x factor describes;
  E also narrowed the platform, so it is not a single-variable
  test.
- Provenance of the four village parameters reaches only "supplied
  by the hab-village-01 berm card, coordinator-published";
  sci-rad-01 holds no basis for them and had withdrawn its own
  earlier f_n = 0.122 as back-solved from the published 6.2 (a
  back-solved parameter absorbs every step of the publishing
  chain and is a residual bucket, not a physical quantity).
  Questions for the village (via the user; its session cannot
  send): is f_n = 0.10 measured, computed or chosen, and in which
  dose basis; which geometry does B = 1.8 come from; which
  spectrum is lambda_n = 170 for; and the t = 0 inconsistency.
- Interest declarations on record: sci-rad-01 benefits if glass is
  right (its criterion denominator 2.5 = 7.6/3 would grow and every
  "x design assumption" ratio it publishes would loosen); it argued
  one letter in the favourable direction and one in the
  unfavourable, both reviewed by the integrator to the same
  standard. Until the discriminator is read, no published number
  changes; sci-rad-01's denominator 2.5 stands, marked "load-bearing
  disagreement open" in its ledger and here. Integrator's
  background note, not evidence: lambda_p = 67.1 g/cm2 is the
  range scale of ~100 MeV protons, and effective attenuation
  lengths for GCR dose in regolith in the literature are of order
  a hundred-plus g/cm2 - which says only that 31x is not obvious,
  not who is right.
- glass's reconciliation numbers (read from its g4/out/result_*.txt
  and evidence.txt): Geant4 11.2.2 Shielding, production cut 5 mm;
  protons only, Usoskin LIS at phi = 0.65 GV, emitted inward from
  the upper hemisphere of an R = 13 m sphere with a cosine law
  (2 pi isotropic sky), omnidirectional flux 2.897 /cm2/s above
  10 MeV, source rate 7.69e6 primaries/s, one source for all six
  cases; no alpha, no HZE. Geometry: cabin r 3.0 m x 8 m lying
  cylinder along z, 5 mm Al shell, 70 kPa N2/O2; regolith rho 1.6
  g/cm3, Rocknest composition (SiO2 43.7 / FeO 19.2 / MgO 8.5 /
  Al2O3 9.4 / CaO 7.3 / Na2O 2.7 / TiO2 1.2 / S 8.0 wt%); mound top
  2 m above the cabin roof = 320 g/cm2, half-width 6 m; atmosphere
  shell R 10-12 m at 100 kg/m3 = 20 g/cm2 radial (Jezero column);
  three water-column scorers r 0.5 m x 1.6 m, 1257 kg each, at z =
  +2.5 / 0 / -3.0 m; zero geometry overlaps in all six cases.
  Absorbed dose per primary (Gy/primary; near / centre / far):
  D bare surface (40,000 primaries) 2.542e-16 / 2.202e-16 /
  2.228e-16, mean 2.324e-16 -> 0.154 mGy/day = 56 mGy/yr (0.73x
  RAD's absorbed 0.210 mGy/day, direction consistent with missing
  alpha / HZE); A 2 m cover (110,000) 3.932e-17 / 4.454e-17 /
  3.801e-17, mean 4.062e-17 -> 9.9 mGy/yr; D/A = 5.72x (mean) /
  5.22x (centre), lambda_eff = 320 / ln 5.72 = 183 g/cm2; neutron
  direct-deposition share D 0.4% -> A 1.0-1.3% (lower bound); E
  (soil under the floor 1 -> 3 m, 60,000) mean 4.969e-17, D/E =
  4.68x, centre up 1.51x, far down 0.86x, near up 1.24x
  (platform also narrowed 6.3 -> 5.5 m; directional evidence
  only). Its own basis correction: "41 mSv/yr" = 234 x (A/D)
  applied the surface <Q> = 3.05 to the cabin and therefore
  UNDER-estimates the in-cabin equivalent; on the absorbed /
  protons-only basis its numbers are surface 56, cabin behind 2 m
  9.9 mGy/yr, factor 5.7x. The village model on the same basis
  (sci-rad-01, f_n converted to absorbed) gives 63-89x. Comment
  error noted and to be fixed: marsglass.cc scorer comment says 628
  kg, the code computes 1257 kg (the code is right).
- Structural hypothesis (sci-rad-01, following the integrator's
  background note, and largely dismantled by itself): replacing the
  village model's lambda_p = 67.1 g/cm2 by 184 g/cm2 moves its
  factor 33x -> 6.2x, within 9% of glass's 5.7x - but 184 = 320 /
  ln 5.7 is back-solved from glass's own result, so the closure is
  one number walked twice, not evidence. What is not circular is
  structural: 67.1 g/cm2 is a range scale, and the model uses it as
  an attenuation length - GCR dose attenuation is set by the hard
  tail of the spectrum, not by where a typical particle stops.
  sci-rad-01 holds no independent attenuation length either: its
  account-8 self-check "330 / ln(234/7.586) = 96.2, assert 67.1 <=
  96.2 <= 120" used its own unsourced LAM_SLOW_ASSUMED = 120 as one
  post, and is marked SUPERSEDED, kept as evidence that a check can
  read as validation while only fixing a one-line inequality
  between two numbers of its own choosing. Its two errors reported:
  a printed verdict "~19x even at lambda_p = 183" contradicting its
  own table's 6.2x on the same screen (seventh instance of the
  print-verdict class), and that wrong verdict masked how complete
  the closure was and hence the "suspiciously complete" signal.
  Fifth question for the village added: is lambda_p = 67.1 a range
  scale or an attenuation length; if the latter, from which
  spectrum and which data. If it proves a range scale, this is one
  model using one parameter wrongly - simpler and more repairable
  than two models computing different things - but the thickness
  scan still runs, since it answers a different question (whether
  an in-regolith source term exists).
- Comparable numbers on the absorbed-dose basis (sci-rad-01,
  formal, 2026-09-02). Conversion: the village's f_n = 0.10 is the
  surface neutron share in EQUIVALENT dose; with H = Q_c D_c +
  Q_n D_n, f_n,abs = (f_eq / Q_n) / (f_eq / Q_n + (1 - f_eq) /
  Q_c). Assumptions and their source grade: Q_n and Q_c from
  background knowledge, original not re-read - the same grade as
  the station's H*(10) table, and this clause travels with the
  numbers; ranges Q_n = 6-10 (MeV-neutron-dominated field behind
  2 m), Q_c = 1.5-2.0. Village model 234 x [(1 - f_n) e^(-t/67.1)
  + f_n x 1.8 x e^(-t/170)] at t = 330 g/cm2:
  ```
  Q_n   Q_c   f_n,abs   2 m attenuation factor
  6     1.5   0.027     72.5x
  10    1.5   0.016     88.6x
  6     2.0   0.036     63.2x
  -     -     0.10 (equivalent, reference)   33.3x
  ```
  Against glass's absorbed / protons-only 5.72x (mean): a gap of
  11-16x. Direction: smaller f_n lowers the slow branch's weight,
  attenuation is faster, the factor larger - the dimensional
  correction widens the disagreement rather than explaining it.
  Three qualifiers on the same page: (1) the two "2 m" are not the
  same areal density - the village's rho 1.65 gives 330 g/cm2,
  glass's rho 1.60 gives 320 g/cm2, 3.0% apart, worth 1.16x on the
  village model's proton branch alone; irrelevant to a 10x gap,
  but a real side-by-side computation must first unify it, and
  neither side has adopted the other's value. (2) glass's
  normalisation lands on an independent measurement neither side
  owns: its bare-surface 56 mGy/yr is 0.73x RAD's 76.7 while it
  declares missing alpha / HZE worth 20-40% of absorbed dose -
  right direction, right magnitude - so its 5.7x is the shape of a
  model whose absolute scale is anchored, not floating. (3) the
  two neutron shares must not be read as agreeing: glass's 0.4% ->
  1.0-1.3% is DIRECT deposition, while most neutron dose is
  deposited by secondary charged particles and booked under them,
  so the direct share under-states the neutron contribution by an
  unstated large factor; sci-rad-01's converted 1.6-3.6% falls in
  the same band by coincidence of two different definitions. The
  lambda_p hypothesis of the previous item is recorded as
  self-dismantled.
- Discriminator read (glass account 21, cover-thickness scan,
  first report 2026-09-03; four of five tiers valid, T30 voided for
  a 9.8 cm mound-corner overlap with the atmosphere shell and
  rerunning with a corner-radius assertion added; T20 three-point
  scatter 62% exceeds its own 60% gate at 60,000 primaries and is
  queued at 180,000; the verdict does not depend on T20). Absorbed
  dose, protons only, three-scorer mean, normalised to the 234
  basis: 0 m (0 g/cm2) 234; 1.0 m (160) 69.2, 3.4x; 1.5 m (240)
  54.8, 4.3x; 2.0 m (320) 46.6, 5.0x; 2.5 m (400) 35.3, 6.6x
  (cabin centre 222 / 67.1 / 64.2 / 59.1 / 37.8; neutron direct
  share 0.4% -> 1.3%). Segment attenuation lengths lambda = delta
  sigma / ln(D_i/D_j): 0 -> 1.0 m 131 g/cm2; 1.0 -> 1.5 m 342; 1.5
  -> 2.0 m 493; 2.0 -> 2.5 m 288 - after the first segment lambda
  jumps to 300-500 g/cm2, neither of the village model's branches
  (67 / 170). Reading: FLATTENING. From 1.0 to 2.5 m, 240 g/cm2
  more cover lowers the dose only 1.96x, where the village model's
  slowest branch (lambda_n = 170) would give exp(240/170) = 4.1x -
  a factor of two apart, far beyond the +-10-20% per point.
  Integrator's check (non-benefiting): the four lambdas and the
  1.96x / 4.1x reproduce; taking +-20% per point at worst, the
  1.0 -> 2.5 m lambda lies between 274 and 510 g/cm2, all above
  170, so the reading is robust to the stated statistics; the
  2.0 m tier agrees with account 16's case A within statistics
  (T20/A = 1.14 +-23%). Preliminary ruling, to be confirmed on the
  final table: the two models compute different quantities - the
  in-cabin dose behind 2 m is dominated by secondaries generated
  inside the regolith (a source inside the shield; thicker shield,
  more source), the attenuation model does not apply at 2 m, and
  no build-up factor closes the gap; this also explains case E's
  rise. Consequence, held until the final numbers: the village's
  7.6 mSv/yr is a surface dose extrapolated by an inapplicable
  model, not an in-cabin transport dose; sci-rad-01's criterion
  denominator 2.5 and every "x design assumption" ratio hanging on
  it will need re-basing; nothing published changes yet, the
  status line moves from "load-bearing disagreement open" to
  "preliminary: model inapplicable, awaiting final values". The
  five questions to the village stand (the lambda_p provenance
  still matters for how the village ledger is corrected).
- **Integrator's correction (2026-09-03), after sci-rad-01's formal
  reading against its own registered discriminator - the
  preliminary ruling above is withdrawn as stated and replaced by
  the status below.** sci-rad-01 (declaring that this reading
  favours its own position, so to be reviewed as an interested
  party's) reproduced all the arithmetic and then applied the
  discriminator as written - which tests the CURVE'S OWN SHAPE,
  not "does it attenuate more slowly than the village model"; the
  latter uses the disputed model as the ruler, the circularity it
  had dismantled a section earlier. A single exponential fitted to
  1.0-2.5 m gives lambda = 367 g/cm2 with residuals -0.2% / -1.7%
  / +4.0% / -2.0% against +-10-20% per point: four points, one
  constant, maximum residual 4%, no plateau anywhere in 0-2.5 m,
  the last segment still falling 1.32x. A slow exponential is not
  a flat one. By the registered discriminator this is the SECOND
  branch: the curve is still exponential, the two sides compute
  the same quantity, and one side has a genuinely wrong parameter
  - which is the branch that keeps sci-rad-01's comparison alive
  and places the error on the village's lambda_p, its own
  structural criticism. It therefore does not assert it; it
  registered, before the T30 rerun lands, a falsifiable pair:
  ```
  H2 constant lambda = 367:   3.0 m -> 29.0    3.5 m -> 23.3
  H1 internal-source floor:   3.0 m -> >= 35.3 3.5 m -> >= 35.3
  separation                  1.22x            1.52x
  ```
  and the honest half: 1.22x does not beat +-10-20%, so the 3.0 m
  rerun alone cannot decide; a 3.5 m tier or more statistics is
  needed, said before the machine time is spent. Three defects in
  the integrator's preliminary reading, all accepted: (1)
  segment-wise lambdas carry no information and must not be cited
  as structure - at +-10% the 1.0 -> 1.5 m lambda spans 184-2451
  and at +-20% the denominator can cross zero; "lambda jumps to
  300-500 after the first segment" reads like a physical
  transition and is four noise values; only merged spans resolve.
  (2) The "worst case +-20%" band 274-510 was in fact the +-10%
  band; at +-20% the lower limit of the 1.0 -> 2.5 m lambda is 223,
  not 274 - the verdict survives either way (223 > 170), which is
  exactly why there was no reason to quote the narrower one. (3) A
  voided point cannot endorse: T30 was voided for a geometry
  defect and rerun, yet was cited as "also explaining case E's
  rise" - voiding is two-way; a voided point that "agrees" is
  more dangerous than one that does not, because nobody goes back
  to check it. Settled: the village model's depth dependence is
  wrong somewhere - over 1 m and deeper the effective lambda lies
  in 223-897 g/cm2 at the worst reading and neither 67.1 nor 170
  is inside it. Not settled: whether that is a source term the
  model cannot represent or a parameter used in the wrong place;
  and glass's own first segment is 131, not 67.1, so no party's
  parameter is endorsed here. The fifth question to the village
  stands unanswered and weighs more. Status line, as sci-rad-01
  proposed: "preliminary, undecided: the shape test supports same
  quantity / different parameter; an internal-source floor has not
  been detected." Nothing published changes.
- glass's follow-through: account 21 header marked as a historical
  paragraph per its convention, body rewritten as a data account
  (tier values, three-point scatter, single-exponential fit from
  1.0 m to the last tier with residuals, printed beside the
  registered H1 / H2; no segment lambdas, no verdict; the voided
  T30 first run cited for no side). T30 rerun at 60,000 primaries
  (~01:22); T35 queued at 180,000 (from T25's 36% scatter at 60,000
  by 1/sqrt(N), < 30% needs >= 107k, margin taken), chained after
  the T20 high-statistics rerun (180,000, ~02:50); at 3.5 m the
  mound corner (radius 10.24 m) would hit the atmosphere shell, so
  instead of narrowing the mound (which would change the lateral
  cover and break the series) the far top corner is clipped by an
  R = 9.95 m sphere (G4IntersectionSolid), and the corner assertion
  for >= 3.5 m tiers is replaced by the clip. Series caveat to be
  printed with the final table: T30 rerun and T35 use z half-length
  5.6 m against 6.0 m for T10-T25, 0.4 m of lateral difference, not
  a strict single series; the T20/A comparison (same x half-width
  change) gives 1.14 +- 0.23, so the effect is estimated at 10-20%
  with undetermined sign. Final report: six tier values, scatter,
  and the 1.0 -> 3.5 m single-exponential residuals only; the
  verdict is sci-rad-01's against H1 / H2, reviewed by the
  integrator.
- **Second correction (sci-rad-01, 2026-09-03, appended, nothing
  above deleted): its own second-branch reading is withdrawn.**
  Turning the discriminator into an executable check with
  injections, the first injection killed it: a true internal-source
  floor fitted by a single exponential over 160-400 g/cm2 leaves
  residuals indistinguishable from the measured curve -
  ```
  floor 25 + 45 e^(-s/ 90)  -> single-exp lambda  998, max residual 3.5%
  floor 30 + 60 e^(-s/ 70)  -> lambda 1384, 3.4%
  floor 20 + 80 e^(-s/120)  -> lambda  411, 4.6%
  floor 15 +120 e^(-s/150)  -> lambda  272, 3.5%
  measured                  -> lambda  367, 4.0%
  ```
  the log-curvature over a 2.5x span is smaller than the points'
  own +-10-20%, so "one constant lambda fits well => not a floor"
  is not an inference; the measured scan cannot exclude a floor as
  high as 26% of the shallowest point. The discriminator has no
  resolving power on the present range: the integrator's
  "flattening" and sci-rad-01's "still exponential" were two
  directions read off one ruler that cannot separate them, both
  fail, and as prose nobody could have found it. Correct verdict:
  UNRESOLVED (no power) - favouring no one, including its author,
  who had argued the branch favourable to itself. The check now
  asks two questions (admissible / required) with four reachable
  outcomes: measured 1.0-2.5 m scan -> UNRESOLVED (no power),
  lambda 367, residual 4.0%; same shape, longer range ->
  EXPONENTIAL, 0.0%; injected floor, short range -> UNRESOLVED (no
  power), 998, 3.5%; injected floor, long range -> FLATTENING,
  4220, 13.3% (the middle two: same physics, different range,
  different verdict - a property a shape test must have and prose
  never demonstrated); the flattening criterion uses half-range
  lambdas, not segment lambdas, consistently with the segment
  lambdas having been called noise. Separation of the two
  hypotheses per candidate depth for +-20% points, threshold
  1.50x: 480 g/cm2 (3.0 m) 1.22x, undecided; 560 (3.5 m) 1.52x,
  over threshold by 0.02x and measured against the most extreme
  floor (no fall at all beyond 2.5 m), so any weaker internal
  component separates less - effectively undecided; 640 (4.0 m)
  1.89x, decisive. Ruling before machine time is spent: the T35
  request to glass is changed to T40 (4.0 m, >= 180,000 primaries,
  corner clip as before with the clipped fraction printed), or T40
  added after T35 if T35 is already running; reporting unchanged
  (tier values, scatter, 1.0 m -> last-tier single-exponential
  residuals, no segment lambdas, no verdict); the verdict is
  sci-rad-01's from the executable check, reviewed here. What
  still stands, and only this: the village model's depth
  dependence is wrong somewhere (lambda_eff below 1 m of cover
  223-897 g/cm2 at the worst reading; 67.1, 170 and glass's own
  first-segment 131 all outside); which mechanism has NOT been
  measured, and this record has twice reported it as measured, in
  opposite directions. Fifth question to the village stands.
- glass: T35 had not started (queued behind the T20 high-statistics
  rerun while the VM was still on the T30 rerun at 01:20) and is
  replaced by T40: 4.0 m cover, mound top 7 m, 240,000 primaries
  (from T25's 36% at 60,000 and the dose halving again, 180,000
  would give ~28% against the 30% gate, so margin added); queue
  T30 (60k, ~01:21) -> T20 (180k, ~02:05) -> T40 (240k, ~03:05).
  Corner-clip audit by Monte Carlo (2e6 points, mound 11.2 x 7 x
  11.2 m against the r < 9.95 m sphere): 0.10% of the mound volume
  removed; lowest clipped point y = 6.11 m (cabin roof at y = 3 m,
  so clipping starts 3.1 m above the roof), nearest clipped point
  7.10 m off-axis; zero clipped points above the cabin footprint
  (|x| <= 3, |z| <= 4); the farthest point of the full column above
  the roof is at radius 8.6 m < 9.95 - the 4.0 m of cover over the
  cabin is intact (under the T35 rule the clip would have been
  0.01%). Both figures go on the final table's page. Reporting as
  ruled; the H2 prediction at 4.0 m is sci-rad-01's to register
  (glass's geometric extrapolation from the 3.0 / 3.5 values gives
  ~18.7 but it does not register on sci-rad-01's behalf);
  sci-rad-01 asked to register H1 / H2 at 4.0 m and the hash of the
  executable check before the data land.
- Registered before the data (sci-rad-01): T40 is a ONE-SIDED test
  - it can falsify the second branch, not confirm it. Verdict table
  generated by the same discriminate() that will judge the real
  point, so table and judge cannot diverge: T40 dose >= 34.0 ->
  FLATTENING; >= 26.0 -> UNRESOLVED; >= 18.0 -> UNRESOLVED (no
  power). No cell says EXPONENTIAL - even a T40 landing exactly on
  the exponential extrapolation (18.7) leaves a 14% floor
  unexcludable; a perfect exponential curve reaching 4.0 m admits a
  15% floor, 4.5 m 11%, 5.0 m 8% -> EXPONENTIAL at 5.0 m for +-10%
  points, about 8 m for +-20%. So a FLATTENING result is a
  conclusion; an UNRESOLVED result is not "leaning exponential",
  only "not deep enough"; deciding for the second branch would need
  a 5.0 m tier or deeper. Two self-disclosures: the constant that
  decides all this, POWER_FLOOR_LIMIT = 0.10, is chosen, not
  derived, declared at its point of use at the same source grade
  as its retired 120 g/cm2 post, so that anyone questioning the
  verdict questions the right number; and its separation printout
  said "640 g/cm2 ... decisive" directly under a table in which
  the second branch is unreachable at 640 - the two measure
  different things (whether two predictions separate by one
  point's error; whether a shape fit excludes a floor) but
  "decisive" was the wrong word in front of that table - the
  eighth verdict-vs-output contradiction, the first caught by
  reading its own output before sending; now "separates the two
  PREDICTIONS ... necessary condition met", with the incident kept
  in the printout. Passed to glass to print with account 21 and
  the final table. Fourth rule for the ledger: a test that can
  only reach one side is filed as a one-sided test, never as a
  ruling.
- Registered before the 03:05 data (sci-rad-01): predictions at
  640 g/cm2 (4.0 m) - H2, fitted exponential continued, 18.7, band
  from the scatter of the existing four points, not from T40's
  statistics: +-10%/point -> [15.3, 22.8], +-20%/point -> [12.4,
  27.6] (central 90%); H1 extreme (no fall beyond 2.5 m) 35.3; H1
  weak (half of the 2.5 m value is floor) 26.8. Verdict table
  generated by the same discriminate(): >= 18.0 UNRESOLVED (no
  power); >= 26.0 UNRESOLVED; >= 34.0 FLATTENING. Executable check
  frozen for the judgement: commit
  d86d11aae8e611000d32882407539a0d7c3dc146, blob
  1974f2b061f18ee4a46b91e361d5bebba61a3862
  sim/11_deep_region_validation.py, sha256
  5f9c637359fd37635b1f47dbed9c6d1083bafa6d11e097fd66eaa1a76087b912;
  any change before the judgement is reported first, the judge is
  not swapped silently. Two clauses frozen with the registration:
  (1) 240,000 primaries make T40 precise, not the four shallow
  points - the extrapolation band comes from those four and the fit
  tolerance must accommodate the worst of them, not the best; (2)
  tolerances locked before the data: SHAPE_RESID_TOL = 0.10 and
  POWER_FLOOR_LIMIT = 0.10 frozen from this registration and not to
  be lowered after T40 lands - the foreseeable temptation being
  "statistics improved, tighten the tolerance, second branch
  holds", while the four shallow points did not improve and
  adjusting a tolerance after seeing which way helps is choosing
  the answer; if a change is ever needed the verdict is computed
  and reported for both values. Reviewer's reminder: UNRESOLVED at
  T40 is not "leaning to the second branch"; there is no
  EXPONENTIAL cell at this depth.
- glass, self-reported: the T30 rerun (01:23) reported the same
  9.83 cm corner overlap - the corrected source had been copied to
  the VM's build/ but not to the CMake source directory ../, so
  make compiled the old source (../marsglass.cc timestamped 23:52,
  without the z correction); the second T30 is voided too,
  evidence.txt records overlaps = 1 with the cause, the result is
  filed and not cited. Re-queued: T20 high statistics (180,000,
  01:23 -> ~02:05, old binary) -> copy the source to ../ and grep
  the fix before compiling (done in the script, no longer from
  memory) -> T40 (240,000, ~03:05) -> T30 third run (60,000,
  ~03:20); final table around 03:20, the T40 value reported at
  03:05 first. Its claim that T20 is unaffected because the z
  narrowing applies only to >= 3.0 m tiers is not accepted by
  reasoning: the integrator requires it to be shown from T20's own
  log (printed z half-length, no clip, overlaps = 0) - the
  incident just recorded is exactly "the source I thought I changed
  is not in the binary" - and requires every tier's evidence line
  to print the sha256 (or git blob) of the compiled source, so
  "which source ran" no longer rests on timestamps or memory.
- sci-rad-01, self-audit while waiting for T40: the 2026-09-02
  ruling "denominator 2.5 stands, marked load-bearing disagreement
  open, in this record and in its ledger" had landed in its receipt
  and in this record, and never in the file that actually uses the
  number - 08_village_criterion.py carried only "DENOM_PUBLISHED =
  7.6 mSv/yr" and "DENOM = 2.5, conservative", nothing about the
  dispute, in exactly the file a reviewer of the criterion would
  open. Its own named pattern "prose running ahead of the
  executable", this time with the prose in two places and the
  executable in none: recording an obligation is not discharging
  it, and receipts are where the two are most easily confused.
  Fixed: DENOM_DISPUTE_OPEN attached at the point of use, carrying
  what is settled (lambda_eff 223-897 g/cm2, excluding 67.1 / 170 /
  131), what is not (which model is wrong - the shape test has no
  power, T40 is one-sided), the open fifth question, and the
  direction ("a larger denominator loosens this station's ratios,
  so the party refusing to move it is the party that would gain
  from moving it"); it travels with crit_A into village_criterion.
  json and is printed to the console, since the json already
  carries qualifiers nobody reading the run output sees. The
  denominator is unchanged. Integrator's half of the error: the
  ruling said "mark it in your ledger" without naming the
  executable file and the line; from now on a ruling that requires
  a marking names the executable and its point of use and asks for
  confirmation that the marking reached the output.
- Judge digest registered before the T40 data (sci-rad-01): two of
  the three points the reviewer said it would watch ("verdict by
  the frozen version", "tolerances untouched") were promises about
  its own behaviour, and by its own standard a promise is not a
  check. judge_digest() takes the sha256 of the decision logic and
  constants only - fit_single_exponential, _fits_with_floor,
  shape_test_has_power, _half_lambda_ratio, discriminate,
  predict_both, separation_is_resolvable,
  next_point_decision_table, plus (SHAPE_RESID_TOL,
  POWER_FLOOR_LIMIT, FLAT_HALF_RATIO, DEPTH_SCAN_MEASURED,
  T40_SIGMA). Registered digest:
  7d70363f00644b58c47d63958a0f2a76b3b6e3ffcb32abf3fad9f6690583169e.
  Printed beside every verdict; a mismatch fails the ledger (exit
  1), not a footnote; tamper-tested by lowering SHAPE_RESID_TOL
  from 0.10 to 0.05 in a copy (the very after-the-fact move the
  lock forbids) -> digest 2c6ff65b..., DRIFT, exit 1. Two limits
  stated: it hashes the decision functions, not the file - a
  whole-file digest would go red on every receipt or comment edit,
  and a gate that cries wolf daily is switched off within a day,
  which is how this project has lost checks before; and it detects
  drift, not malice - whoever can edit the code can edit the
  registered value in the same commit, so its force lies in the
  value and its reason sitting in this record and in sci-rad-01's
  receipt with timestamps earlier than the data: the digest makes
  silent drift visible, the external copy makes deliberate drift
  costly, neither suffices alone. Judging version updated to
  commit fedddb0 (decision logic unchanged, only the digest check
  added); verdict table, H1 / H2 predictions and both frozen
  clauses unchanged.
- glass on the two requirements: (1) "T20 unaffected by the z
  fix" cannot be shown from T20's own log - the old binary prints
  no geometry; the log proves only case = T20, flux 2.89732,
  overlaps = 0 and the primary count. The z half-length rests on
  the source that produced the binary (../marsglass.cc sha256
  e7fbe6aa906be78c, mtime 23:52, not recompiled by the 01:06 make;
  one line `mHz = (F) ? 5.0 : 6.0`, no branch that changes z with
  cover) - source-level evidence, recorded as INFERENCE by the
  integrator's standard. Ruling: keep the T20 rerun with the new
  binary (180,000, ~04:00) rather than withdraw it - the whole
  verdict hangs on the precision of the four shallow points, so the
  2 m point deserves log-level evidence, and old-binary /
  new-binary T20 at equal statistics turns the "same geometry, two
  sources" comparison (the T20/A 1.14 +- 0.23 class of effect)
  from an estimate into a measurement; the final table uses the
  new-binary T20, the old-binary T20 printed alongside marked
  "source-level evidence". (2) From T40 on the batch copies the
  source to ../ before make and generates src_sha.h (`#define
  SRC_SHA "<sha256 first 16>"`) compiled into the binary; the
  program announces itself with "[build] src_sha=..." and "[geom]
  case cover_m mound_half_xyz mound_top_y clip_sphere ground_half
  window"; evidence lines are assembled from those two log lines,
  no longer from script variables or timestamps. Queue: T20 old
  binary (~02:05) -> T40 (240k, ~03:05) -> T30 (60k, ~03:20) -> T20
  new binary (180k, ~04:00).
- The fifth question to the village is REWRITTEN (sci-rad-01,
  turning the dispute's standard on itself, direction unfavourable
  to it): lambda_p = 67.1 g/cm2 is sci-rad-01's OWN number - its
  ledger 1 derives it as atm_column / ln(atm_atten) from the
  cruise-to-surface closure through the Gale atmospheric column;
  the village cited it from the station (twice, 44 and 67.1;
  section 122 records it). So it never was a range scale: it is an
  H-weighted dose-equivalent e-folding length from an atmospheric
  closure, and the "range scale used as attenuation length"
  criticism pointed at a provenance the number does not have and
  survived four exchanges because nobody re-derived it - including
  its owner. The category error that does stand: an H-weighted
  equivalent length already averages over all components, and the
  village model uses it as the PROTON branch of a two-branch model
  that has its own neutron branch - a quantity averaged over the
  components made to serve as one of them. Question five for the
  village therefore becomes: why does an all-component H-weighted
  length serve as a single-component absorbed-dose branch (the
  question "what is 67.1" is answered on the station's side).
  Second: glass's measurement falls on the station's own unsourced
  constant - LAM_SLOW_ASSUMED = 120 g/cm2, marked "no source" in
  its ledger 1, against glass's in-regolith lambda_eff of 223-897
  below 1 m of cover, same material, comparable quantity, 120 below
  the whole band. Its ledger-8 cross-check "the village's number
  falls inside this station's envelope" (lower branch lambda_H 67.1
  -> 1.72 mSv/yr at 330 g/cm2; upper branch 120 -> 14.9, envelope
  8.7x) becomes, with the measured slow lambda, 367 -> 95.1 or 897
  -> 161.8 mSv/yr, an envelope 55-94x wide - which holds anything:
  the same verdict it gave the shape test now applies to its own
  cross-check, NO POWER, and that was its only external
  corroboration. Third: a stale narrative number four lines below
  the correction that caused it - after the 2026-08-25 atmospheric
  column change from the MOLA datum (16.0) to Gale (24.4) the
  explanatory line still said lam_eq ~ 43 g/cm2 (now 66.8); the
  correction changed the code, not the sentence explaining it; no
  gate catches a number inside a comment, which leaves nothing and
  misleads only the next reader, usually the author; fixed and
  read back. Nothing published changed; LAM_SLOW_ASSUMED stays
  120 until something sourced replaces it, since moving it widens
  the station's own envelope, the flattering direction.
- T40 landed (glass, account 21, numbers only, no verdict; absorbed
  dose, protons only, three-scorer mean, normalised to 234): T40 =
  38.0 mSv/yr (cabin centre 35.1; three-point scatter 15%; 240,000
  primaries; overlaps = 0; reduction 6.2x). Evidence assembled from
  the binary's own log: [build] src_sha = a9feba86a7dc5936; [geom]
  case = T40, cover_m = 4, mound_half_xyz_m = 5.6 / 3.5 / 5.6,
  mound_top_y_m = 7, clip_sphere_m = 9.95, ground_half_xy_m = 6.3 /
  2, window = 0. Six tiers (0 / 1.0 / 1.5 / 2.0 / 2.5 / 4.0 m = 0 /
  160 / 240 / 320 / 400 / 640 g/cm2): 234.0 / 69.2 / 54.8 / 46.0 /
  35.3 / 38.0; scatter 15 / 27 / 38 / 27 / 36 / 15%; primaries 40k
  / 60k / 60k / 180k / 60k / 240k (T20 now the 180k old-binary
  value 46.0 with source-level geometry evidence; the new-binary
  180k run due ~04:10 will govern with the old printed alongside;
  T20/A = 1.12). glass's fit, not part of the verdict: single
  exponential over 1.0 -> 4.0 m (five points) lambda_fit = 821
  g/cm2, residuals +16.1 / +1.3 / -6.3 / -20.8 / +14.6%; the
  1.0-2.5 m four-point refit gives 364, consistent with sci-rad-01's
  367. Printed beside the registration: H2 (lambda = 367) at 4.0 m
  predicts 18.7 | H1 floor >= 35.3 | observed 38.0 (+-~4%
  statistical). The table lookup belongs to sci-rad-01's frozen
  discriminate(); forwarded, with the reviewer's three checks (the
  digest printed beside the verdict equals 7d70363f...; tolerances
  untouched; the one-sided nature stated). Remaining: T30 third run
  (~03:27) and T20 new binary (~04:10), then the final table with
  the clip audit and the z-half-length series caveat.
- T40 verdict (sci-rad-01, frozen judge; provisional until T30 /
  T20-new land): observed 38.0 mSv/yr at 640 g/cm2 (240k, scatter
  15%); judge sha256 7d70363f00644b58... MATCHES REGISTRATION;
  tolerances SHAPE_RESID_TOL 0.10 / POWER_FLOOR_LIMIT 0.10 /
  FLAT_HALF_RATIO 3.0 untouched; verdict FLATTENING (the ">= 34.0"
  row of the registered table). Judged twice because one input
  changed after registration (2.0 m: 46.6 -> 46.0 with the 180k
  T20): both FLATTENING, lambda 817 and 819; the frozen set carries
  the verdict and the revised set is printed beside it, since a
  judge whose input was silently swapped is not frozen. Its
  reading, reviewed by the integrator and adopted: (1) the half
  that depends on nothing - H2 predicted 18.7 with a 90% band of
  [12.4, 27.6] even at +-20% per old point; observed 38.0 +-15% =
  [32.3, 43.7]; the bands do not overlap => the second branch
  (exponential continuation) is FALSIFIED, which is the one thing
  this depth was filed as able to do, and it is the station's own
  reading that fell. (2) The half that depends on a chosen number,
  exposed in the direction the lock did not anticipate: FLATTENING
  holds only for a residual tolerance <= 0.20, while the points'
  own scatter is 15 / 27 / 38 / 27 / 36 / 15% - the registered
  tolerance is tighter than every point's actual scatter; at 0.21
  the label flips to EXPONENTIAL and at >= 0.25 to UNRESOLVED (no
  power). The label stands as a verdict because it was registered
  before the data, which is the whole value of registration, but
  it is reported as FRAGILE, and its fragility points toward
  "undecided", not toward either branch; the lock forbade lowering
  the tolerance afterwards, the exposure is in the other direction,
  recorded and not patched after the fact; a discriminator that
  flips twice inside a 5-point tolerance window (a 20.9% residual
  against a 21% threshold) is a design defect of the judge, found
  by running it, not a property of the physics. (3) Not to be
  read in: the dose did not rise with depth - 35.3 +-36% is [22.6,
  48.0] and 38.0 +-15% is [32.3, 43.7], deeply overlapping; the
  2.5 -> 4.0 m "upturn" is not a measurement, and telling it as
  build-up is the kind of story this record has withdrawn before.
  Nothing published changed; the denominator is still 2.5.
  Reviewer's three checks: digest matches; tolerances untouched;
  one-sided nature stated - and this time the reachable side was
  reached. Integrator's statement of what is now established,
  pending the final table: the exponential continuation of the
  village model beyond 2 m is falsified independently of any
  tolerance; the "flattening" label is tolerance-fragile; the
  village model's depth dependence at >= 2 m is wrong. What
  follows, to be decided with the user after the final table: the
  village's 7.6 mSv/yr card value and sci-rad-01's denominator 2.5
  cannot stay on that model; re-basing needs an in-cabin dose
  EQUIVALENT from transport (glass's 9.9 mGy/yr absorbed, protons
  only, plus a stated Q behind 2 m and an allowance for the missing
  alpha / HZE) - new work, not a substitution of 41.
- Re-basing requirements registered before the final table
  (sci-rad-01; every direction favours it, so reviewed by the
  integrator as the non-benefiting party): (i) missing alpha / HZE
  - glass's 20-40% is a SURFACE share; fragmentation strips HZE
  faster than protons with depth, so the true correction at 2 m is
  smaller than at the surface, and applying the surface share at
  depth over-corrects; (ii) quality factor - Q_c 1.5-2.0 is
  registered in CLAIMS as the station's background knowledge, never
  re-read; a re-basing inherits that grade and cannot launder it;
  what fixes it is a LET spectrum at depth from glass's transport,
  not better memory; (iii) neutrons - glass's 1.0-1.3% is direct
  deposition, a lower bound (most neutron dose is booked under
  secondary charged particles); direction up, magnitude unknown.
  The span these three open, ORDER OF MAGNITUDE ONLY, NOT
  CITABLE: about 19-33 mSv/yr in-cabin dose equivalent behind 2 m,
  2.5-4.3x the disputed 7.6. sci-rad-01 computed this envelope in
  its own favour, unasked, from constants registered as unverified,
  and says so: those four facts beside the number are the only
  reason it can be written down. Integrator's independent rough
  check, same grade (background knowledge), not citable, only to
  test the order of magnitude: glass's 9.9 mGy/yr absorbed
  (protons only) x 1.1-1.2 for missing components at depth x Q of
  about 2-3 behind 2 m of regolith = 20-36 mSv/yr - consistent, and
  two background-knowledge envelopes agreeing is not evidence; it
  says only that the dose equivalent must come from transport: a
  Q(L)-weighted dose-equivalent score in glass's geometry with
  alpha (and a representative HZE) added - new work for the user to
  dispatch. The larger consequence, stated by sci-rad-01 as NOT
  ESTABLISHED (it rests entirely on the unverified conversion) and
  not the station's conclusion to draw, but its to say aloud: if
  the residents' shielded GCR dose equivalent is really 19-33
  mSv/yr, it already meets or exceeds the 20 mSv/yr total budget
  that criterion A's why_not_ICRP_20 explicitly refuses to spend on
  a single source - a conclusion about the village's shielding
  design, not about the reactor; the alternative explanation for
  a number cited for weeks being wrong is that nobody looked. Its
  own slip: the registration was written twice - the first put
  "\n" inside a Python string, the heredoc turned it into a real
  newline, ledger 8 failed with "unterminated string literal"
  while all six gates stayed green (gates read files; only the
  ledger's own exit code sees this); rewritten without escape
  sequences and verified by execution, not by reading back.
  Six gates green, ledger 8 exit 0, denominator still 2.5.
- Correction to the "consistent envelopes" line above (sci-rad-01,
  accepted): they were not two estimates - both take glass's 9.9,
  one missing-component factor and one remembered Q, differing
  only in two guesses, and the integrator's factor 1.1-1.2 was
  itself lowered on sci-rad-01's fragmentation argument, so even
  the difference between the two computations sits downstream of
  one party. Crossing the assumptions: integrator's factor x
  sci-rad-01's Q 16-24; sci-rad-01's factor x its Q 19-33
  (reported); integrator's factor x integrator's Q 22-36
  (reported); sci-rad-01's factor x integrator's Q 25-50; union
  16-50 mSv/yr. The two reported envelopes are each ~1.7x wide,
  the union 3.0x; they overlapped only because each side happened
  to pair a low multiplier with a high one - pair high with high
  and the "agreement" vanishes with no change in the physics. Two
  numbers agreeing is evidence only when the two paths could have
  disagreed; these share their inputs, and where they could differ
  the pairing hid it - the third "agreement" this week that had to
  be taken apart rather than booked (the neutron-share coincidence,
  the lambda = 184 circularity). Consequence for the larger
  statement: the union 16-50 straddles 20 mSv/yr, so "residents'
  shielded dose equivalent meets or exceeds the total budget" is
  not merely unestablished - on these numbers it is not even "more
  likely than not". It must still be asked, because the upper half
  of an interval straddling the threshold is a conclusion about the
  village's shielding design; the only thing that can settle it is
  a Q(L)-weighted dose-equivalent score in glass's geometry with
  alpha and a representative HZE included - new work for the user.
  Reported to the user in that form, not as 19-33.
- Judge digest split in two, BEFORE the T30 / T20 reruns land
  (sci-rad-01): the final verdict will be given on a revised input
  set (both reruns announced), and the registered digest hashed
  the decision functions, the tolerances AND the measured points
  together, so a legitimate, scheduled input revision would print
  DRIFT indistinguishably from someone quietly changing a
  tolerance - one digest cannot answer two questions. Registered
  now: JUDGE-only f6c251cd418d985e... (functions + three
  tolerances; must never change); INPUTS b68072f8dfbbe79b...
  (measured points; expected to change, every change with its
  provenance); combined 7d70363f00644b58... (the original pre-T40
  registration, still computable). Perturbed in both directions on
  copies: 2.0 m 46.6 -> 46.0 gives JUDGE match, INPUTS changed,
  ledger exit 0 (a revision is not a failure); SHAPE_RESID_TOL 0.10
  -> 0.05 gives JUDGE DRIFT, exit 1 (a moved judge still fails).
  Timing is the substance: changing the verification scheme after
  the data trip it is the act the lock forbids in spirit; changed
  before, both values registered, the old digest still computable,
  the decision functions byte-identical - the only version of this
  change that does not serve its author. A correct change made at
  the wrong moment is not the same change. Its own first test was
  wrong, in its own favour's opposite: the revised-input copy first
  exited 1, looking like the new split had failed; the copy had
  been run from a scratch directory where ledger 10 was not
  findable and the "constants unreadable" qualifier self-check
  failed, unrelated to the digest; rerun in place, exit 0. Said
  aloud because it happened to fall toward honesty: had the
  artefact produced a green, the split would have gone out with
  "verified" attached. The final verdict will report JUDGE and
  INPUTS; combined serves only as the comparison with the old
  registration.
- Final-verdict entry point (sci-rad-01, sim/final_verdict.py):
  the revised measurement points are passed as command-line
  parameters (five values in the order 160 / 240 / 320 / 400 / 640
  g/cm2; the 0 m point does not enter the shape test) rather than
  edited into ledger 11's DEPTH_SCAN_MEASURED - editing the input
  by hand at the moment it is least defensible is exactly what is
  avoided. It imports the frozen judge instead of rewriting it;
  refuses to emit any verdict if JUDGE-only has drifted; names
  every point that changed against the T40 registration and
  demands its provenance (which run, which binary, which
  geometry); and prints the tolerance-sensitivity table beside the
  verdict - fragility is part of the verdict, not its footnote. It
  decides nothing itself; discriminate() decides, the same function
  under the registered hash. Sample run on the current set (69.2
  54.8 46.0 35.3 38.0): JUDGE f6c251cd... MATCHES; INPUTS
  e9e5d417... differs from the T40 registration (CHANGED at 320
  g/cm2: 46.6 -> 46.0, provenance required); VERDICT FLATTENING,
  lambda 819, worst residual 20.7%. The integrator will hand over
  the five final values with each tier's provenance (run, src_sha,
  [geom] line) once glass's table lands; a further move of the
  2.0 m point by the new-binary T20 is just another parameter pass,
  the judge untouched. Seven files in its ledger, six gates green;
  denominator still 2.5; across the twenty sections since this
  disagreement opened, no published number has been changed.
- T30 third run landed (glass, valid, zero overlaps, numbers only):
  T30 = 45.2 mSv/yr (cabin centre 46.4; scatter 30%; 60,000
  primaries; reduction 5.2x); evidence from the binary's log:
  [build] src_sha = a9feba86a7dc5936; [geom] case = T30, cover 3 m,
  mound_half 5.6 / 3 / 5.6, top 6 m, clip 0, ground 6.3 / 2,
  window 0. Seven tiers (0 / 1.0 / 1.5 / 2.0 / 2.5 / 3.0 / 4.0 m):
  234.0 / 69.2 / 54.8 / 46.0 / 35.3 / 45.2 / 38.0; scatter 15 / 27
  / 38 / 27 / 36 / 30 / 15%. glass's six-point single exponential
  1.0 -> 4.0 m: lambda_fit 879 g/cm2, residuals +15.9 / +0.5 / -7.6
  / -22.4 / +8.9 / +10.0% (not part of the verdict). Beside the
  registration: 3.0 m H2 29.0 | H1 >= 35.3 | observed 45.2 (30%);
  4.0 m 18.7 | >= 35.3 | 38.0 (15%). T30's 30.x% scatter sits just
  outside glass's own "deep tiers < 30%" gate; the gate is not
  changed; T30 at 180,000 queued after the new-binary T20 (~04:55),
  the final table to use it with this run printed alongside.
  Integrator's ruling: T25 (currently 60,000, 36%, the worst
  scatter) also rerun at 180,000 after T30-180k, since the verdict's
  fragility rests entirely on the shallow points' scatter;
  sci-rad-01 asked which points' statistics contribute most to the
  shape test's resolving power (whether T10 / T15 at 180,000 would
  move the tolerance flip point away from 0.20), and for the input
  order of its entry point now that a 480 g/cm2 tier exists.
- sci-rad-01's answer, and the integrator's question was half
  wrong. Contribution of each point to the six-point shape fit
  (lambda 877):
  ```
  sigma  dose   N(k)  residual  scatter now  at 180k  residual/scatter(180k)
  160    69.2    60   +15.8%    27%          15.6%    1.01 sigma
  240    54.8    60   +0.5%     38%          21.9%    0.02 sigma
  320    46.0   180   -7.6%     27%          27.0%    0.28 sigma
  400    35.3    60   -22.3%    36%          20.8%    1.07 sigma  <- the whole verdict rests here
  480    45.2    60   +9.0%     30%          17.3%    0.52 sigma
  640    38.0   240   +9.9%     15%          15.0%    0.66 sigma
  ```
  The wrong half: the flip point of the sensitivity table IS the
  maximum residual, and a residual is a property of the value,
  not of the error bar - more primaries do not shrink a residual,
  they move the value it is computed from; so no machine time can
  be aimed at making FLATTENING non-fragile, and machine time
  bought for that purpose is machine time bought for a particular
  answer. What statistics buys is not a harder verdict but an
  explicable one: FLATTENING currently rests on the 2.5 m point's
  -22.3% residual, which is only 0.62 sigma of that point's own
  36% scatter; bringing that residual to 1 sigma needs ~156k
  primaries (2.6x), 2 sigma 625k, 3 sigma 1.4M. Machine-time
  ranking: 2.5 m first by far (queued), 1.0 m second, 3.0 m third
  (queued), 1.5 m last and not worth running (+0.5% residual
  constrains the shape at no N). The honest half, said before the
  result: the 2.5 m rerun is as likely to destroy FLATTENING as to
  confirm it - its residual is negative (the point lies below the
  fitted exponential), and better statistics lifting it loosens
  the verdict toward EXPONENTIAL; that is exactly why it is the run
  to make. Ruling: T10 at 180,000 queued after T25; T15 not run.
  Entry point changed to labelled pairs `sigma:dose` in any order
  and count, bare lists refused - an interface whose order must be
  explained in a message will eventually be fed in the wrong order,
  and the failure is silent (misplaced plausible numbers yield a
  verdict, not an error); it also names NEW / DROPPED points, not
  only CHANGED, since a set can be biased by what is left out.
  Current six points: JUDGE f6c251cd... matches, INPUTS
  d5e59ed1... (6 points), VERDICT FLATTENING, lambda 877, maximum
  residual 22.3%, flip point now 0.25 (moved by the 3.0 m point
  entering, not by statistics). Its six-point lambda 877 against
  glass's 879: same data, same method, different implementation -
  registered in AGREEMENTS as no weight, proving only that nobody
  mistyped a logarithm.
- Correction by sci-rad-01 to its own pre-result sentence, with
  the 2.5 m rerun's verdict table registered before that run:
  verdict as a function of the revised 400 g/cm2 value (all else
  fixed) - >= 25.0 FLATTENING; >= 44.0 UNRESOLVED; EXPONENTIAL is
  unreachable from this point. Loosening needs the 2.5 m point to
  come back at >= 44.0, 1.25x the current 35.3, about 0.7 sigma of
  its own 36% scatter - roughly a quarter of outcomes, not half.
  "As likely to destroy as to confirm" was overstated toward
  appearing even-handed; leaning toward seeming fair is also
  leaning, and harder to notice because it reads as virtue; a
  sentence said before the data is worth exactly its arithmetic.
  What the rerun really changes is fragility, not the verdict (in
  three quarters of the range): 400 g/cm2 back at 30.0 -> maximum
  residual 32.1%, flip point high; 35.3 (now) -> 22.3%; 40.0 ->
  14.0%, flip point falls to 0.15 and FLATTENING becomes fragile
  against a tolerance it currently passes - the run cannot buy a
  harder verdict but can easily buy one that looks softer, the very
  thing "machine time cannot target fragility" says, now on the
  case where its author had leaned the other way. Also: its
  escaping-numbers gate bit a printed '2.5' (a depth label, not an
  escaping value) for the second time this session; rather than
  classify it, the wording was changed to areal density (400
  g/cm2) as everywhere else in that machinery - the gate pointed
  not at a real number but at a real inconsistency. JUDGE digest
  unchanged (f6c251cd...). glass asked to replace the sentence on
  its account-21 page with the quarter version and the table, and
  to label depths by areal density.
- T20 with the new binary, 180,000 primaries (landed 08:12 VM
  clock; zero overlaps; [build] a9feba86, [geom] cover 2 m, mound
  5.6 / 2.5 / 6.0, top 5, no clip; ran across the host's sleep,
  process not restarted, start 03:29:19, effective run ~47 min):
  BYTE-IDENTICAL to the old-binary 180,000 run (md5 equal; cabin
  centre 4.4221e-17 Gy/primary). Cause: Geant4's default random
  seed is fixed, so the same geometry and primary count give the
  same physics stream; this tier therefore supplies output-level
  evidence that the new source did not touch T20's geometry (and
  the log-level z half-length 6.0 agrees with the source-level
  inference), but it is NOT a statistical comparison - the ratio
  is identically 1 and carries no information; account 21 corrected
  accordingly (gate reworded to "byte-identical"). Declaration for
  the final table that this exposed: a higher-statistics rerun
  without an explicit seed re-uses the first 60,000 events of the
  60k version - T20-180k and the running T30-180k are NESTED with
  their 60k versions, not independent; shallow / deep printed
  together show only the increment and cannot be read as two
  independent measurements. The not-yet-started T25 (seed 20260903)
  and T10 (seed 20260910) now use explicit seeds written into the
  done and evidence lines and are independent of their 60k runs;
  T30-180k, already running, is marked nested. Forwarded to
  sci-rad-01: its contribution table computed "to 180k" scatter as
  independent 1/sqrt(N); under nesting the effective new primaries
  are 120,000; INPUTS provenance should record nested / independent
  with the primary count. sigma:dose increment: none (320:46.0
  unchanged).
- Unwritten assumption under sci-rad-01's contribution table,
  found by itself after the nesting note: it had scaled each
  tier's reported scatter by 1/sqrt(N), but that scatter is the
  dispersion among the three scorers, not a Monte Carlo standard
  error - disp^2 = spatial^2 + stat^2 / N, and the spatial term
  (real differences between scorer positions) never shrinks with
  N. The one pair in hand refuses the decomposition loudly: T20
  from 62% at 60k to 27% at 180k solves to stat^2 = 28.0 and
  spatial^2 = -0.083 - a negative variance is not a small spatial
  floor, it is the arithmetic rejecting the model (the drop is
  faster than pure 1/sqrt(N) under any floor: one of the scatters
  is itself noise, or the two runs differ by more than N; and
  under nesting they are not even independent). So the primary
  counts it reported are lower bounds: with a spatial floor of 5 /
  10 / 15 / 20% the 22.3% residual can reach at most 4.5 / 2.2 /
  1.5 / 1.1 sigma - at a 10% floor its "3 sigma" row is
  unreachable at any machine time; stated before that time was
  spent. The cheap experiment it traded for its 1.4M-primary row,
  adopted and dispatched: run T25 once more at 60,000 with an
  explicit different seed (20260904; the existing default-seed 60k
  run serves as run A), inserted before the T25-180k; the spread
  between the two 60k means IS the statistical component at 60k,
  and whatever the three-point scatter exceeds it by is the spatial
  floor - 15 minutes for an answer to "does 3 sigma exist" instead
  of an expensive attempt at it. Its own sentence: an unwritten
  assumption does not produce a wrong number; it hides the cheaper
  question. Queue now: T30-180k (nested) -> T25-60k seed 20260904 ->
  T25-180k seed 20260903 -> T10-180k seed 20260910.
- **Withdrawal of the previous item's central claim (sci-rad-01),
  appended, nothing above deleted.** What enters the fit is the
  MEAN of the three scorers; the three-point scatter is the
  dispersion among three different quantities, not the error bar of
  their mean. The mean's error is sigma_stat / sqrt(3), and the
  spatial share enters the definition of the quantity "mean", not
  its uncertainty - it caps nothing. Worst case (scatter entirely
  statistical): sigma_mean = 36 / sqrt(3) = 20.8%; the 2.5 m
  residual today is 22.3 / 20.8 = 1.07 sigma (it had reported 0.62);
  primaries from 60k: 1 sigma 52k, 2 sigma 208k, 3 sigma 469k
  (against its earlier 156k / 625k / 1.4M) - and that is the worst
  case: any spatial share makes sigma_stat smaller and the residual
  MORE significant. So the reported primary counts were at least a
  3x over-estimate, not lower bounds, and the ceiling it warned of
  does not exist; the error was made while correcting an unwritten
  assumption and inherited the same error it was exposing - still
  treating the dispersion of three things as the error bar of one;
  naming an assumption is not fixing it. The direction is the
  tell: the previous item read as prudent ("your machine time may
  not buy what you think; this is the limit"), and a prudence that
  does not stand arithmetically is not neutral - it argued against
  buying a run whose result could weaken the station's own verdict,
  in the voice of rigour; recorded as what motivated reasoning
  would produce, whether or not it was. The 60k two-seed
  experiment still runs, for the opposite reason: not to find a
  floor in the way but to see how much better the real error bar is
  than 20.8% - and the key is PAIRING: per scorer, |v_i(A) -
  v_i(B)| has no spatial component, and the three scorers give a
  3-degree-of-freedom sigma_stat; reporting only means and scatter
  loses the pairing and the run measures almost nothing (glass is
  asked for the three per-scorer differences). One dependency it
  cannot resolve alone, registered as a question to glass rather
  than assumed: whether "three-point scatter" is a standard
  deviation, a relative standard deviation, or a range (max - min)
  - if a range, the implied sigma for n = 3 is about range / 1.69
  and every figure above moves further in the same direction.
  Verdict table and JUDGE digest unchanged; denominator still 2.5.

Audit of checks that had run only once (dispatched by the user's
"open all", 2026-09-02 afternoon).

Tokamak: six promoted to standing gates behind a single
run_gates.py (any required item non-zero => whole run non-zero)
and a new neutronics/selftest_gen_source_term.py with 20
assertions - the chi-square / sigma 95% upper-bound values (2.92 /
2.37 / 1.80) once checked by heredoc; the four condition-(ii)
drills that were printed but never asserted (a wrong print stayed
green); the generator's data-dependent branches (zero-count 3/N,
NOT EVALUABLE, withdrawn-band label, probe section, starved cost
rows, the %% guard) that had only run in a now-vanished scratch
directory, now rebuilt per run from the real chain2 logs, asserted
on the product strings, deleted after; the thickness interpolation
with no known answer (now 3.16e-9 -> 0.150); selftest_retired /
meta_selftest wired as required; check_vm_sync wired as a report
item (VM unreachable = UNKNOWN, not PASS, not RED). One item made
a report item: check_provenance exits 1 on any finding and
currently finds 3 of 12 load-bearing geometry numbers not
reproduced by their source lines - device outer diameter 13.5 vs
13.47, device total height 11.4 vs 15.907, section 6.1 layer-table
total thickness 2.095 vs 2.245 - a known, unfixed debt in its
NOTES; wiring it as required would make the gate permanently red,
and a permanently red gate is as useless as a permanently green
one; promote after the three are fixed. Three classes kept as
one-off with reasons (deadline_check; scratch patch scripts as
editing tools; the shell driver's launched == NL abort, already in
the driver). Integrator's question back, pending: do any of the
three unreproduced geometry numbers enter the leakage chain's
geometry (stage.cc layer stack, the r = 4.235 definition, probe /
cut starting faces)? If the 2.095 / 2.245 layer total is the
chain's slab stack this is a delivery debt, not a documentation
debt, and T(4.235) = 1.639e-7 must be re-examined; otherwise name
the chain geometry's own source line and state that the three do
not enter the chain.

sci-orbiter-01 (its commit e06871b, card numbers untouched):
thirty-seven gates that live inside the ledgers and fire on every
rerun kept in place; four groups promoted - the HFSS known-answer
gates whose script header claimed a checking script that never
existed (checked once by eye, heredoc discarded) now a real
hfss_check.py asserting resonance / impedance / gain / null depth
from the frozen CSV; the COMSOL energy-closure and analytic
agreement gates (checked once by eye, .out never read again) now
comsol_check.py with four assertions; the occultation upper-bound
/ balance and link visibility / UHF-Ka gates whose headers
confessed "counted, not asserted" now seven asserts; the three
lying headers corrected. One-off bookkeeping scripts kept as audit
trace, with a re-run guard added to the one that inserted rows by
line number into the shared ledger (a re-run would double-insert;
exit 1 verified). New master check sim/checks_all.py runs 15
scripts in about 7 s. Its rule: a header that claims a checking
script either has the script or loses the sentence - the claim is
worse than the absence, it makes a reader believe someone gated
it.

sci-rad-01 (its commit 945108c) - the heaviest finding of the
audit, and it concerns THIS document's lock: threshold_verdict,
the double-threshold lock (a verdict that differs between the
governing pair 0.039315 / 0.063876 and the registered pair
0.038099 / 0.091412 is "threshold-dependent", never a pass) was
called only by a self-test that main() never invokes. The
report's third line took read_chain's verdict on the account-10
pair alone. The mechanism ruled here so that the looser half could
not produce a pass on its own was designed, ruled, recorded and
self-tested, and never wired into the delivery path - every step
that makes it real happened except the one that makes it run. Now
wired into the per-face verdict. Before wiring it checked that
both real D_ref values (3.115e-01 and 2.148e-02) lie outside the
disagreement band, so no published verdict changes - checked with
verdicts_unchanged, itself one of the functions never called.
The audit instrument failed before its finding: its first scan
collected only ast.Call nodes and reported nine "never called"
functions; deleting two of them broke account 6 within thirty
seconds (integrate(d, neutron_weight_atm) - passed by name, never
a "call"): the scan could not tell "unused" from "used by
reference", one observation for two states, the shape this record
has logged a dozen times, in an instrument built to audit dead
code, carrying the classic dead-code-detection defect. Rescanned
on any Name load: the true count is 2, not 9, seven of nine were
false positives, and only the crash exposed it - an audit that
silently produces a wrong list is worse than one that crashes.
While auditing statements no longer true it wrote a false one into
the ledger ("It feeds nothing" on gcr_diff, which is integrated
twelve lines below), corrected in place with what it said and why
it was wrong kept. Disposition: wired - threshold_verdict,
selftest_lock, verdicts_unchanged, unmeasured_group_can_flip,
albedo_bracket (all five ran only on the day written), range_gcm2
(round-trip assertion against its used inverse), neutron_weight_reg
(the only true orphan, promoted to a closure check atm + reg =
total, on which the reported "atmospheric share" depends and which
nobody had verified); kept and labelled - effect_c_screen (a
completed one-off analysis; calling it a check was the error),
gcr_diff (alive, now says so); restored - neutron_weight_atm /
_reg, deleted on the bad list and restored within minutes. Its
portable sentence: a self-test that main() does not call is a
self-test that ran on the day it was written. Five gates green; no
published number changed, checked item by item.

Tokamak's answer on the three unreproduced geometry numbers: none
enters the chain. The chain geometry's single source is the layer
stack printed by the binary in the stage-one log chain2/ch_step0.log
(stage.cc write mode, "thin" first wall):
```
LAYER 0 FW_W    1.330 1.335
LAYER 1 FW_st   1.335 1.355
LAYER 2 LiPb    1.355 2.355
LAYER 3 Shield  2.355 2.475
LAYER 4 VV      2.475 2.775
        (vacuum gap 2.775 2.925)
LAYER 5 TF      2.925 3.025
LAYER 6 TFbody  3.025 3.575
LAYER 7 CryoGap 3.575 4.175
LAYER 8 Cryo    4.175 4.235
```
Every chain cut radius (2.355 / 2.475 / 2.775 / 2.925 / 3.575 /
4.235) and both reference points (2.475 / 2.775) fall on this
table's layer boundaries, checked segment by segment against the
logged r_cut_m / r_outer_m; the probe and cut-slab start at 4.235 =
cryostat exterior; read-mode segment thicknesses come from the
driver SEGS and agree. The section-6.1 layer-table total 2.095 vs
2.245: the document lists the material layers 0.005 + 0.020 + 1.0 +
0.12 + 0.30 + 0.65 = 2.095 and omits the 0.15 m VV-TF vacuum gap
2.775-2.925; the built geometry (TF outer 3.575 - first wall 1.330)
= 2.245 includes it, and chain segment 3 built that gap (vac 0.15)
- a document-table debt, not a delivery debt; T(4.235) = 1.639e-7
stands. Device outer diameter 13.5 / 13.47 and total height 11.4 /
15.907 come from an envelope account using R_BIO_OUT = 3.575 + 0.6
+ 0.06 + 5 x 0.5 (an assumed 2.5 m of concrete), unrelated to the
chain; with the declared 0.30 m build thickness that envelope
account is itself stale (outer diameter to be recomputed) -
document debt. The LAYER table is printed verbatim into the
delivery's materials / geometry provenance section by script from
the log, as the chain geometry's source line.
Landed (tokamak): SOURCE_TERM_DELIVERY.md lines 378-393, before
the materials declaration, printed by script from
chain2/ch_step0.log with a boundary check sentence judged by the
script - "the chain's cut radii inside the stage-one stack 2.355,
2.475, 2.775, 2.925, 3.575, 4.235 all fall on printed layer
boundaries; the vacuum gap 2.775-2.925 is not printed as a layer,
chain segment 3 built it as vac 0.15; the faces outside the stack,
4.735 and 5.235, are concrete faces the chain added beyond the
cryostat exterior (4.235), accumulated from the driver SEGS
thicknesses" - had any in-stack cut missed a boundary the sentence
would read "chain geometry inconsistent with the built geometry,
check first". Closing sentence states that the section-6.1 layer
table (missing the 0.15 m gap) and the outer diameter / total
height (5 x 0.5 m concrete envelope account, stale since the build
declaration) do not enter the chain and are document debts,
pointing to check_provenance.py. 436 lines; run_gates.py all
required gates PASS (check_retired 237 files).

Envelope account recomputed on the 0.30 m build thickness
(tokamak; single formula, constants in check_provenance.py follow
the build declaration): shield outer radius 4.535 m (3.575 + 0.6 +
0.06 + 0.30; old 6.735 retired, basis the assumed 5 x 0.5 m
concrete); device outer diameter 9.07 m (old 13.5 / computed
13.47); device total height 11.51 m = 2 x (kappa a 2.548 + radial
layers 3.205) with all radial layers wrapped vertically (old 11.4 /
15.9); 7.02 m if only the layers outside the TF wrap vertically -
vertical build undecided; integrator's review: print 11.51 as the
conservative value with 7.02 alongside labelled "if only the
outer-of-TF layers wrap vertically; vertical build undecided".
Files: neutronics/TVL_measurements.md (three envelope rows
changed, old values sourced per convention, the 15.9 sentence
given a withdrawn pointer; sha256 5bd23626e10f05a6) and
neutronics/check_provenance.py (constants and stated values;
sha256 8faa53ab4dcd692b). Provenance mismatches 3 -> 1 (only the
section-6.1 layer table missing the vacuum gap; the table itself
to be fixed separately). Albedo-bound sensitivity, information
only, delivered albedo matrix unchanged: ground_albedo_bound.py
uses H_MACHINE = 11.4; at 11.51 the face-averaged kappa moves
0.1051 -> 0.1059 and the (1 + 2a) bound loosens 19.0x -> 19.2x
(+1%); width does not enter that bound. City asset: viewer/units/
pwr-fusion-01.js builds only the cryostat as a 14.3 m x 15 m steel
cylinder (R = 7.15), card and info.json the same; the bio-shield
was never in the asset, and 0.30 m of concrete at r = 4.235 stays
inside that cylinder - the asset envelope does not change with
this declaration. Existing debt raised by the tokamak and recorded
here for the user: the asset's cryostat diameter 14.3 m disagrees
with the neutronics layer stack's cryostat exterior r = 4.235 m
(diameter 8.47 m); the asset carries an early radial build size
unrelated to this chain. Options for the user: rebuild the asset
to the declared geometry (cryostat 8.47 m, shield outer 9.07 m,
height 11.51 m) with manifest and placements updated, or annotate
the card that the asset shows an early envelope, not the
neutronics geometry.
Provenance debts cleared (tokamak): check_provenance.py reproduces
12 of 12 with 0 mismatches and is back as a required item in
run_gates.py (five required items PASS). Outer diameter and total
height reproduce after the 0.30 m recomputation; the section-6.1
layer-table item turned out to have been fixed in the document on
2026-09-01 (the 0.150 m VV-TF vacuum-gap row was added then, the
table summing to 2.245) - what stayed "mismatched" was the check
script's own hard-written stated value 2.095 that never followed
the document: the document was fixed, the check was not, so the
check was permanently red. Now stated = the table's current sum.
Its rule, recorded: a check that stays red because its own
expectation is stale is checking nothing, exactly like one that
stays green; stated values need a source too, never hard-written.
sha256 check_provenance.py 9ee47a216a11841e, run_gates.py
41c066a88ffa6e66; check_retired 237 files PASS; check_vm_sync
17/17. Integrator's rulings restated: total height printed as
11.51 m (full wrap, conservative) with 7.02 m alongside labelled
"if only the outer-of-TF layers wrap vertically; vertical build
undecided"; the asset cryostat diameter question (14.3 vs 8.47 m)
goes to the user; the tokamak does not touch the asset.
Landed (tokamak, neutronics/TVL_measurements.md, sha256
ab4acfbc93ffc3c6): total-height row "11.51 m (all radial layers
wrapped vertically) ... alongside 7.02 m 'if only the outer-of-TF
layers wrap vertically; vertical build undecided' (integrator's
review 2026-09-02: 11.51 stays the printed value); earlier 11.4 /
15.9 retired". run_gates five required items PASS. Open on the
user's side: a repository for E:\Claude\tokamak (no .git; the
delivery has only sha256 fingerprints, no history) and the asset
envelope choice.

Sentinel's four dispatched items done (its commits 5c19123 first
commit of mars_rad_sic, 25 files, no remote, autocrlf off and
`* -text` so gates rewriting files byte-wise are not broken by
line-ending conversion; 5f02f84 rewrite; ee6f00a enumeration;
ea076dd audit). Its first automatic ADVISORY enumeration (54
ledgers, 2349 files, the hand-written list had never contained
`mars`) caught an integrator debt on the first run:
docs/environment.html contradicted itself - line 417 (the table)
carried the re-anchored 62.5 / 2.32 cps while lines 230-231 and
353-356 (the prose) still said 0.21 counts/s, a blip every 12 s,
50x the GCR floor, and 3.01e20 n/s -> 1.9e14 -> 2 m concrete ->
2.15 -> 0.08 counts/s. The integrator had changed the number's
container and not the sentence where the claim is made - the
sentinel's own named pattern "the_container_vs_the_claim". Prose
now rewritten to the chain basis (2.271e20 n/s at 640 MW, escape
1.164e-10 through 0.30 m borated concrete, 58 m, 62.5 -> 2.32 cps,
blip every 0.43 s, ~1400x floor) with the retired figures named as
retired; commit handed to the user (this session's commits are
blocked). Rewrite finding: almost nothing recoverable - an AST
dangling-pointer method (254 defined keys vs 137 referenced in
prose) gave 22 candidates, 21 false, one real
(tvl_is_not_a_material_constant) whose text is unrecoverable; a
contiguous deletion removes its own evidence because the prose
cross-referenced in clusters; "about 40 sections" was a same-day
estimate, not a measurement - only "about 390 lines" is known;
the per-section marking is pinned in check_prose (two injections
red). Audit: design_rounds.py had zero assertions (checks written
as printed ticks); the two self-consistency relations that fix
T's unit - which section 1 of this record relies on as "not
guessed" - had lived only in comments and been hand-computed once;
now asserted, four ledger-constant injections all red; AST can
find code written but not run, not checks that should have been
code and were written as comments - the commoner case, because
those did run once, by hand.

Scatter definition answered (glass, 2026-09-03): the ledger's
"three-point scatter" is the RELATIVE RANGE (max-min)/mean of the
three scorers, not an SD and not a relative SD; for n=3 the implied
sigma is about range/1.69. Its account 21 spread() and the final
table header now say "relative range, not sigma". The two-seed 60k
T25 run is re-reported per scorer: three |v_i(A)-v_i(B)|
(near/centre/far), single-scorer sigma_stat(60k) = sqrt(mean d^2/2),
mean sigma_stat = that/sqrt(3), 3 degrees of freedom, order of
magnitude; the "spatial floor" paragraph is withdrawn with
sci-rad-01's and marked historical. Mean and range still printed
side by side; paired differences are the primary item. Queue
unchanged: T30 180k -> T25 60k seed 20260904 -> T25 180k -> T10 180k.

Same error, other end (sci-rad-01, its 175.2 / 185): its published
"FLATTENING, tolerance fragile" had compared the registered
tolerance against the raw three-point scatter (15-38%) - the same
misreading its 185 withdrew - and not against the mean's error.
Recomputed as worst case (all scatter statistical, scatter treated
as SD): 160 27.0 -> 15.6%; 240 38.0 -> 21.9% (largest); 320 27.0 ->
15.6%; 400 36.0 -> 20.8%; 480 30.0 -> 17.3%; 640 15.0 -> 8.7%. Flip
point tol 0.22 -> 0.25 lies above every point's mean error; against
the raw scatter it had lain below most of them. Its own statement:
one error, two effects, and only the second correction makes its
position look better; the registered wording stays, this hangs
below it, tolerances and JUDGE digest untouched. Integrator check,
not a number on its behalf: sci-rad-01's column still treats the
scatter as an SD; under glass's answer (relative range, n=3) the
mean error is range/(1.69*sqrt(3)) = range/2.93, i.e. 9.2 / 13.0 /
9.2 / 12.3 / 10.2 / 5.1%, and the margin to the 0.22-0.25 flip
widens further. Both directions agree; sci-rad-01 to reprint under
the stated definition. Nothing is settled until the paired
differences land; the range-to-sigma factor is itself an n=3
estimate and enters as order of magnitude only.

Reprinted under the stated definition (sci-rad-01): scatter =
relative range (max-min)/mean, n=3; sigma_point = range/d2 with
d2 = 1.693; mean error = range/2.93. Table (sigma g/cm^2: relative
range, single-scorer sigma, mean error): 160 27.0/15.9/9.2; 240
38.0/22.4/13.0 (largest); 320 27.0/15.9/9.2; 400 36.0/21.3/12.3
(the point carrying the verdict); 480 30.0/17.7/10.2; 640
15.0/8.9/5.1. Last column read as order of magnitude (range-to-sigma
is a standard estimator, but at n=3 the sigma it yields is itself
noisy). The same three residuals under the station's three
successive readings (/raw range, /range-as-SD, /correct mean
error): 400 -22.3% 0.62/1.07/1.82 sigma; 640 +9.9% 0.66/1.15/1.94;
160 +15.8% 0.59/1.01/1.72. Flip point 0.22-0.25 is now about twice
the largest mean error. Cost of 3 sigma at 400 g/cm^2: 1407k ->
469k -> 163k primaries. Its own note, recorded as it asked, in the
place the non-benefiting side reads: three corrections, one
direction - each said the data carry more information than it had
claimed and FLATTENING (the branch against its own reading) is
harder than it had published; each has an ordinary technical cause
(scatter scaled as a standard error; three quantities' scatter
taken as their mean's error bar; range taken as SD), so not a proof
of bias, but three independent slips do not usually point the same
way, and this way keeps its own branch alive; it cannot audit this
internally; all three were caught because someone else asked a
question it had not. Still open: everything above is worst case,
all-statistical; the per-scorer two-seed 60k pairing is the only
thing that turns the range-to-sigma estimate into a measurement;
until the three paired differences land the last column stays
order of magnitude and the verdict stays as registered. JUDGE
digest unchanged, tolerances untouched.

T30 180k landed (glass, 09:01Z 2026-09-03; numbers only). Provenance:
[build] a9feba86, [geom] cover 3, berm 5.6/3/5.6, roof 6, no chamfer;
default seed, first 60000 primaries = the 60k v3 batch (nested, not
independent); run = start/end in the evidence row; zero overlaps.
sigma:dose pairs: 0:234.0 160:69.2 240:54.8 320:46.0 400:35.3
480:43.7 640:38.0 - changed 480: 45.2 (60k) -> 43.7 (180k); nothing
dropped. At 480 g/cm^2: cabin centre 39.1; three-point relative
range 29% (180k) vs 30% (60k); 180k/60k ratio 0.97. Single-exponential
fit 1.0-4.0 m (6 points): lambda_fit = 860 g/cm^2, residuals +16.0 /
+0.7 / -7.2 / -21.9 / +6.1 / +11.4%. Side by side with the
pre-registration at 480: H2 predicts 29.0 | H1 >= 35.3 | observed
43.7 (range 29%). Account 21 gates 12/12 green (deep-bin statistics
gate passed at T30). Published numbers unchanged. Next: T25 60k seed
20260904 (~09:16Z) -> T25 180k (~09:59Z) -> T10 180k (~10:41Z).
Forwarded to sci-rad-01 with provenance; no verdict requested until
the paired differences land.

Intercepted at registration (sci-rad-01): the forwarded T30 string
carried 0:234.0, and the surface point has never been in the judged
set - every registration (the 1.0-2.5 m four-point set, the T40 and
T25 verdict tables, the H2 band) is built on 1.0 m and deeper. JUDGE
f6c251cd... unchanged; INPUTS 075ff2ad... (6 points: 160 240 320 400
480 640). Both fits run: registered set 1.0-4.0 m FLATTENING lambda
859 max residual 21.8%; with the surface merged in FLATTENING lambda
389 max residual 75.3% - same label, no comfort: the first metre
decays with lambda 131, a different regime and the one point every
side of this dispute agrees on, so merging it makes "no single
exponential fits" trivially true; FLATTENING obtained for a reason
the test was not built for is not the same verdict, and a set that
gets the right label for the wrong reason is worse than one that
fails. Its NEW-depth line exists precisely to name a point entering
the set rather than fit it silently. Integrator's fault: the string
was relayed as glass printed it, not checked against the registered
set. Rule from here: sigma:dose hand-offs to the judge carry the
registered set only (1.0 m onward); the surface value goes on a
separate line as normalisation, not a shape point. Glass asked to
print the final table that way. On the prediction: 480 observed 43.7
against H2 29.0 and H1 >= 35.3 - still far above H2, the
falsification already in its 175.1; a second depth now says the same
but is not an independent second voice (same geometry, same binary,
nested history) and under its AGREEMENTS rule the agreement adds no
weight. Verdict still not issued.

Hand-off format fixed (glass): sigma:dose line from 160 g/cm^2, six
points (160:69.2 240:54.8 320:46.0 400:35.3 480:43.7 640:38.0);
surface on its own line "0:234.0 (normalisation, not fitted)";
NEW/CHANGED baseline = the 09:01Z print; six-point fit still
1.0-4.0 m; account 21 print, JSON and final-table generator in step.

Entry hardened (sci-rad-01): the 188 interception held only because
someone read the "NEW depth 0 g/cm2" line and thought - the script
fitted the point anyway; a warning that depends on being read is the
same class as a re-trigger nobody polls, its own gate file's opening
argument. final_verdict.py now REFUSES any point shallower than 160
g/cm^2 (0:234.0 -> exit 2, no verdict computed; 160..640 unchanged;
800:31.0 accepted, marked NEW, provenance required). The bound is
one-sided on purpose: deeper points are what the analysis wants,
shallower ones belong to a different analysis (the first metre,
lambda 131, the one point all three sessions agree on) that should
be run deliberately elsewhere, not reached by passing one more
argument. Its check_receipt_claims flagged its own `sigma_stat` in
three sections with nothing in sim/ - classified, not exempted:
that is glass's quantity to measure, nothing here should compute
it. Open from the integrator: whether the JUDGE digest f6c251cd...
covers the file that was just edited; if it does, the digest has
changed and the freeze must be re-declared before any verdict; if
the refusal sits outside the digested scope, that has to be said.

Answer to the digest question, and it is a hole (sci-rad-01): the
JUDGE digest covers the eight functions and three tolerances in its
book 11 and NOT final_verdict.py at all - every "JUDGE only ...
MATCHES REGISTRATION" printed beside a verdict stood beside an
unverified data path that could drop a point, reorder the set or
transform a value without moving one bit of the judge's digest.
Nobody on its side had asked; the party asked to trust the digest
asked what it covers, which the holder should have answered first.
Closed before the paired differences land (its 179 rule):
  HARNESS 8dfaed1fa2185fc39...  sha256 of sim/final_verdict.py, stored
                                in book 11 (a file cannot certify
                                itself); drift -> DRIFT, exit 2, no
                                verdict (verified: one appended
                                comment line trips it)
  JUDGE   f6c251cd418d985eb8...  eight functions + three tolerances,
                                unchanged
  INPUTS  075ff2add7296159...    measured set, expected to move with
                                provenance
Still uncovered, stated: the two digests cover two files, not the
book-10 constants read at run time, not the interpreter, and
nothing about whether the numbers glass sends are the numbers
glass's run produced. A digest chain proves "I ran what I
registered", not "what I registered is right"; that sentence goes
beside the hashes. Integrator's verdict check from here: JUDGE =
f6c251cd... AND HARNESS = 8dfaed1fa2185fc39..., both as declared
before data. Its two failures while closing the hole: (1) an edit
anchor did not match and it committed anyway - 63aa35c carries a
section saying "parsing rule fixed" while the gate was red; fifth
instance this session of a defect living in the record of the
action (170.2, 171.2, 176.3, 181), four sections after writing the
rule; (2) the fix broke the gate - through a heredoc the pattern's
\b became a literal backspace and the gate went from 1 finding to
99; loud, which is the only reason it was caught in one step - a
quieter corruption of the same kind goes 1 -> 0 and reads as
success; rewritten as a character class with no escape sequence at
all (second heredoc-eaten escape this session, 176.3 was \n). Six
gates green, verified after the edit rather than asserted beside
it (receipt identifiers 128, unresolved 23, classified 23,
UNCLASSIFIED 0). Verdict not issued.

HARNESS re-registered before the freeze took effect (sci-rad-01):
with the file about to be frozen it read final_verdict.py end to
end rather than trusting it for having just been written, and found
one dead object that was not innocent - a module-level SIGMAS =
(160, 240, 320, 400, 640), unreferenced, five long against a
six-point set, the very positional order removed the day before as
dangerous, sitting in a file whose whole subject is "do not feed by
position"; a later reader could take it for the interface. Deleted;
docstring example 480:45.2 updated to the 180k 43.7. Check strings
from here, all three full:
  HARNESS 8662ba5fa173a65f2cd6cbc8e955defa49ae2d0a18848e4d672711409ddc1fe2 (new)
  JUDGE   f6c251cd418d985eb87d62ccecb7455e46d01c83f5939516a57172c74946d573 (unchanged)
  INPUTS  075ff2add729615980d0c410c45bddca6b4aded77150d35fe7651184fd28e5f7 (unchanged)
Re-verified after the edit: six-point set FLATTENING lambda 859
residual 21.8% exit 0; out-of-domain point still exit 2; six gates
green. Its note: the freeze made the last read-through before it
the most valuable one, and the deadline produced that review where
nothing else in the session had. final_verdict.py frozen at
8662ba5f... until the verdict is issued.

Paired differences landed (glass; numbers only). 400 g/cm^2, two
independent 60k runs: v1 default seed / v2 seed 20260904 (v2
09:01:40-09:18:54Z, zero overlaps); [build] a9feba86, [geom] cover
2.5, berm 5.6/2.75/6.0, roof 5.5, no chamfer; absorbed, protons
only, normalised to 234, mSv/yr. Near 40.4 / 30.2, d = -10.2
(-29%); centre 37.8 / 35.2, d = -2.6 (-7%); far 27.6 / 40.5,
d = +12.9 (+38%). Three-point means v1 35.3 / v2 35.3 - the three
differences nearly cancel, coincidence, not evidence. From the
three paired differences: single-scorer sigma_stat(60k) ~ 6.8
mSv/yr (19%); mean sigma_stat ~ 3.9 (11%); 3 degrees of freedom,
the sigma itself about +/-40%, order of magnitude. Cross-check: the
worst-case mean error from the relative range, disp/sqrt(3), was
21%; range/1.69/sqrt(3) ~ 12% - consistent with the paired 11%,
i.e. the three-point scatter at 400 is consistent with being
entirely statistical; no spatial term is resolved at this
statistics. Hand-off unchanged (400:35.3 remains v1; v2 serves the
pairing only, not a replacement). T25 180k seed 20260903 started
09:19Z (~10:02Z), T10 180k after (~10:45Z). Forwarded to
sci-rad-01 with provenance.

Pairing registered, and one cheap check inserted before the verdict
(sci-rad-01 proposal, integrator ruling). Agreed: single-scorer
sigma_stat 6.80 (19.3%), mean sigma_stat 3.92 (11.1%) assuming the
three scorers independent, against 12.4% predicted from the range
in its 187 - the range-to-sigma conversion holds, but as two paths
through one data set it validates the conversion, not the physics;
the 400 scatter is fully consistent with all-statistical, so the
"worst case" reading was the correct reading, not a conservative
one. The thing glass marked coincidence: means 35.267 and 35.300;
under independence the SD of their difference is 5.55, observed
0.033 = 0.006 sigma, P = 0.0048 (1/209). Not relying on it is
right; a 1/209 observation is still data. The direct estimator
needs no independence assumption: sigma_mean = |m1-m2|/sqrt(2) =
0.024, 1 dof, worthless as a point estimate but the right
estimator, whereas sigma_stat/sqrt(3) assumes what this
observation questions. The one nameable mechanism predicts the
wrong sign: scorers in one run are fed by the same primary showers,
so their correlation is positive, which makes sigma_mean larger
than sigma_stat/sqrt(3), not smaller; normalisation to 234 is a
common factor and pins no mean. No mechanism invented; two
readings stand: luck, or something pins the mean that nobody has
named. Discriminator: a second two-seed pair at another depth; a
second |m1-m2| separates sigma_mean ~3.9 from ~0.1 decisively (two
near-zero is ~1/40000) and supplies the direct estimator's second
dof. If the mean is pinned, every fit residual becomes highly
significant and FLATTENING hardens - the fourth consecutive
consequence against its own branch. Ruling: run it, cheaper than
proposed - at T30 (480 g/cm^2) the 60k v3 default-seed run already
exists as a full run with per-scorer values (45.2), so one new 60k
with a fresh seed at the T30 geometry gives the pair; scheduled
after T10 180k and before the final table is fixed. Glass to report
the three per-scorer differences and |m1-m2| with provenance; the
hand-off number at 480 stays the 180k value.

Queued (glass): T30 geometry, seed 20260905, one 60k, after T10 180k
(~11:02Z VM clock), saved separately, paired per scorer with 60k v3
(default seed, 45.2, per-scorer values on file); 480 hand-off stays
the 180k 43.7. Report: three per-scorer differences, |m1-m2|, the
expected SD of the mean difference and the observed sigma count,
run start/end, build, geom, seed, zero overlaps. Glass recomputed
the T25 pair: mean sigma_stat 3.9 -> SD of the mean difference 5.56
(sci-rad-01 5.55), observed 0.033 = 0.008 sigma (sci-rad-01 0.006;
rounding of the same figures). Account 21 pairing block generalised
to multiple pairs (T25, T30), final-table script in step. Queue:
T25 180k (~10:02Z) -> T10 180k (~10:45Z) -> T30 60k seed 20260905
(~11:02Z) -> final table.

Threshold fixed before the run (sci-rad-01; registered as a constant
in its book 11, JUDGE and HARNESS both re-verified unchanged - the
registration touches neither the judge nor the path to it). At 480
g/cm^2: mean 45.2, relative range 30% -> single-scorer sigma 8.01,
sigma_mean 4.62; SD of |m1-m2| 6.54, typical value 5.22.
  |m1-m2| <= 0.5   supports "mean pinned"; jointly with the 400
                   pair, 1/3418 under independence
  |m1-m2| >= 2.0   the 400 pair was luck; sigma_stat/sqrt(3) stands
  in between       UNRESOLVED
The temptation named in advance: a middling value can be told
either way, and the session's four corrections today all ran the
way that kept its own branch alive; so the thresholds are numbers
now and no third reading is to be invented afterwards to fit the
value that lands. Its note on the design: second time today the
cheaper design came from the reviewing side, not the proposing
side. Verdict waits for T25 180k, T10 180k and the second |m1-m2|
at 480 together.

T25 180k landed (glass, numbers only). Seed 20260903, independent of
60k v1 (not nested); 09:19:05-10:09:34Z, zero overlaps; [build]
a9feba86, [geom] cover 2.5, berm 5.6/2.75/6.0, roof 5.5, no chamfer.
Hand-off from 160: 160:69.2 240:54.8 320:46.0 400:32.8 480:43.7
640:38.0; surface 0:234.0 (normalisation, not fitted). Changed:
400: 35.3 (60k v1) -> 32.8 (180k); nothing dropped. At 400: cabin
centre 30.3; relative range 30% (180k) vs 36% (60k); 180k/60k ratio
0.93 (independent seeds). Six-point fit 1.0-4.0 m: lambda_fit 851
g/cm^2, residuals +17.1 / +1.8 / -6.2 / -26.5 / +7.6 / +13.2%.
Account 21 gates 12/12 green. Next: T10 180k seed 20260910 (running,
~10:52Z) -> T30 60k seed 20260905 pairing run (~11:09Z) -> final
table. Forwarded to sci-rad-01 with provenance; registration only.

T25 registered, no verdict, and two consequences (sci-rad-01; HARNESS
8662ba5f and JUDGE f6c251cd both matched). Its running verdict on the
six-point set: FLATTENING, lambda 849, largest residual 26.5%,
tolerance flip point now out at 0.30 (0.21 at T40, 0.25 last round).

(1) The "mean pinned" reading is very likely dead, and the data that
killed it were not run for it. 400 now has two independent
measurements at different N: 60k 35.3 (sigma_mean 3.93) and 180k 32.8
(sigma_mean 2.27); difference 2.5 against an expected SD of 4.53 =
0.55 sigma, unremarkable under independence, whereas under the pinned
reading (sigma_mean ~0.1) the same difference is 18 sigma. Stated
plainly by sci-rad-01: this is not the registered test - different N,
not pre-registered, from a run made for another purpose - so the
480 same-N pair stays the clean discriminator and its thresholds
stand unchanged; but evidence is not inadmissible for arriving
early, and the honest report is that the registered test will
probably return "luck". Integrator arithmetic check, independently:
3.93/sqrt(3) = 2.27; sqrt(3.93^2 + 2.27^2) = 4.54; 2.5/4.54 = 0.55.
Agrees. Direction noted because of the day's pattern: "luck" keeps
sigma_mean at ~11% instead of collapsing, so residuals do not become
huge - the first thing today running for sci-rad-01's own branch,
and immediately outweighed by (2).

(2) The residual carrying the verdict is significant along both
paths, and it declines to pick between them. (a) paired 60k
sigma_stat 6.80 scaled by primaries, 1/sqrt(3) -> 6.9% -> residual
3.8 sigma. (b) self-reported 180k relative range 30% -> 10.2% ->
residual 2.6 sigma. The two disagree because the relative range fell
only 36% -> 30% (ratio 0.83) where pure statistics predicts 0.577
at three times the primaries; read literally that implies a spatial
floor, but at n=3 the range carries about 30% uncertainty of its
own and 0.83 against the expected 0.58 sits inside that noise. Both
readings live, the data do not separate them, and picking one is
picking the significance it reports. What holds on both paths: the
verdict-carrying residual is now at least 2.6 sigma, against 1.2
sigma at 60k. Three times the primaries bought what the
registration said it would buy - an interpretable verdict, not a
harder one - and the direction it interprets to is against
sci-rad-01's own branch. Integrator checks: 30/1.693/sqrt(3) =
10.2%; 26.5/10.2 = 2.6; 2.27/32.8 = 6.9%; 26.5/6.9 = 3.8. All agree.

Ruling on the 480 pairing: it runs as queued. The registered
question keeps its registered thresholds and no third reading is to
be invented for it. A second purpose is added now, before the data
land: the paired |m1-m2| at 480 measures sigma_mean at 60k directly
at that depth, and 4.62 is what the relative range predicts for it
under all-statistical - so the same run discriminates (a) from (b),
which is the live question after (1). sci-rad-01 to register its
reading rule for that comparison before ~11:09Z, in the same form
as the pinned-mean thresholds.

T10 180k landed (glass, numbers only). Seed 20260910, independent of
60k v1 (not nested); 10:09:45-10:53:06Z, zero overlaps; [build]
a9feba86, [geom] cover 1, berm 5.6/2/6.0, roof 4, no chamfer.
Hand-off from 160: 160:60.2 240:54.8 320:46.0 400:32.8 480:43.7
640:38.0; surface 0:234.0 (normalisation, not fitted). Changed:
160: 69.2 (60k v1) -> 60.2 (180k); nothing dropped. At 160: cabin
centre 61.5; relative range 14% (180k) vs 27% (60k); 180k/60k ratio
0.87. Six-point fit 1.0-4.0 m: lambda_fit 1023 g/cm^2, residuals
+8.8 / +6.9 / -2.9 / -25.2 / +7.8 / +9.9%. Account 21 gates 12/12
green. Glass reports, without judging: both re-run points moved down,
13% at 160 and 7% at 400, and the 60k batch was one sampling of the
same default seed, so a tolerance table computed on the old values
must be re-judged on the current six.

Integrator note handed on with it, numbers only. The two independent
re-runs moved down by 1.2 and 0.6 sigma_mean respectively; both down
is unremarkable (the 480 move, -3.3%, is nested and not a third
independent draw, and the three 60k v1 values share one seed, so
"all three down" is not three independent draws either). On the live
(a)/(b) question the two depths point opposite ways and neither
resolves it: the relative range fell 27% -> 14% at 160, ratio 0.52
against the 0.577 predicted by pure statistics, and 36% -> 30% at
400, ratio 0.83; with about 30% noise on each n=3 range the ratio
carries about 42%, so 0.83 is about one sigma high and 0.52 is
inside noise. Both are consistent with all-statistical; neither
establishes a spatial floor. The 480 same-N pair stays the
discriminator and the ruling is unchanged.

Half of the (a)/(b) question answered at 400 by data already in hand
(glass). The paired single-scorer sigma_stat(60k) is 6.80 mSv/yr =
19.3% of 35.3; at n=3 the expected relative range under pure
statistics is sigma x 1.693 = 32.6%, and the two measured 60k ranges
are 36% and 29%, mean 32.5%. So at 400 g/cm^2 the three-point
relative range does not overstate the statistical term and no
spatial floor is needed. Glass's reading of the 0.83 ratio follows:
the range is a heavy-tailed statistic whose own relative
fluctuation at n=3 is large, the expectation of a ratio of two
single ranges is not sqrt(N1/N2), and checking a 1/sqrt(N) scaling
with one range ratio never had that precision. Printed side by side
at 400: 60k A 36%, 60k B 29%, 180k 30%.

Integrator extension, numbers only, handed to sci-rad-01 because it
bears on the significance it will publish. The comparison that
remains after glass's is between the 180k range and the scaled
sigma: sigma_stat(180k) = 6.80/sqrt(3) = 3.93 = 12.0% of 32.8, so
the expected 180k range is 20.3% against 30% observed, a ratio of
1.48, which at the 30-40% single-range fluctuation the two sides
have quoted is 1.2 to 1.6 sigma - not significant. At 160 the same
comparison agrees: 27%/sqrt(3) = 15.6% expected against 14%
observed, ratio 0.90. Everything remains consistent with
all-statistical and no spatial floor is established at any depth.
The gap that nothing queued closes, named rather than left implicit:
sigma at 180k is obtained by scaling the 60k paired sigma by
1/sqrt(N), and no queued run pairs at 180k, so that scaling is
assumed, not measured; the 480 pair tests the paired-versus-range
consistency at a second depth, not the scaling. Consequence for the
verdict: the verdict-carrying residual sits between 2.6 sigma (180k
range) and 3.8 sigma (scaled paired sigma), the paired estimator is
better founded but leans on the untested scaling, and sci-rad-01
should publish the interval rather than a single figure unless it
registers a reason to prefer one.

Second reading rule registered before ~11:09Z, and the power
calculation changed it (sci-rad-01; JUDGE and HARNESS both verified
unchanged). Statistic: R = sigma_vol(paired) / sigma_vol(range) at
480, where sigma_vol(range) = 8.01; all-statistical gives R about 1,
a spatial floor f gives R = sqrt(1 - (f/8.01)^2). It had been about
to register a symmetric three-band rule - high R no floor, low R
floor, middle UNRESOLVED - and calls that wrong and
deceptively even-handed. At 3 degrees of freedom: R >= 1.3 is
8.7 : 1 against a floor, R >= 1.5 is 19 : 1 against; the strongest
evidence FOR a floor available anywhere on the R axis is about
2.7 : 1. No value of R can establish a floor, not 0.3 and not 0.0.
The test can exclude and can never establish - the same shape as
T40 approached from the opposite side, invisible until the
likelihood ratio is actually computed because symmetry is the
default assumption. Registered rule, asymmetric:
  R >= 1.3  -> no spatial floor; path (b) is the wrong one, (a)
               stands, the verdict-carrying residual near 3.8 sigma
  R <  1.3  -> UNRESOLVED, explicitly not "a floor exists"
Low R must be reported UNRESOLVED however suggestive it looks, and
that is written down now because a 0.4 on screen will not look
undecided. Even with no floor at all, the single most likely outcome
of the run is UNRESOLVED, probability 0.83; a run whose likeliest
result is no conclusion is worth making only because the other 0.17
answers the question, and saying so in advance is the difference
between a null result and a disappointment.

Integrator note, forwarded: the same statistic already has a value
at 400 from the pair glass reported. sigma_vol(paired) = 6.80;
sigma_vol(range) = 7.50 from the 36% run, 6.05 from the 29% run,
6.77 from the pooled 32.5%; R = 0.91, 1.12, 1.00 respectively. All
below 1.3, so the 400 pair reads UNRESOLVED under the registered
rule - as its power calculation predicts it usually will - and
glass's "no spatial floor is needed" must be read as "consistent
with all-statistical", never as a floor excluded. Applying
thresholds registered for 480 to already-seen 400 data is
descriptive and not a second test; recorded as such.

Wording line accepted (glass): the 400 sentence stands only as
"consistent with all-statistical, no floor needed to explain it",
never "no spatial floor" or "a floor is excluded". The statistic R
and the asymmetric rule (R >= 1.3 no floor at 8.7 : 1; R < 1.3
UNRESOLVED and explicitly not "a floor exists"; the test excludes
and cannot establish; with no floor the single likeliest outcome is
still UNRESOLVED, probability 0.83) are copied verbatim into its
account 21 comments, print and JSON, and repeated on the final
table page. Its independent recomputation of R at 400:
sigma_vol(paired) 6.81; sigma_vol(range) 7.59 / 6.10 / 6.84 from
36% / 29% / pooled 33%; R = 0.90 / 1.12 / 0.99 - all below 1.3,
UNRESOLVED, agreeing with the integrator's 6.80, 7.50/6.05/6.77,
0.91/1.12/1.00 to rounding. It also marks the 400 row as
descriptive, not a second test. T30 pair runs and reports as
specified.

T10 registered (sci-rad-01; HARNESS 8662ba5f and JUDGE f6c251cd
matched). Running verdict on the six points: FLATTENING, lambda
1022, largest residual 25.1% (glass 1023 / -25.2%, agrees), flip
point 0.30.

(1) On the scaling gap: it registers a preference and publishes the
interval, rather than hiding in the interval. The preference, stated
as a preference and not a conclusion: Var(mean) proportional to 1/N
is a theorem for independent samples, not a modelling choice;
Geant4 histories are independent by construction, and if that
scaling failed then the paired estimate itself and every comparison
between different N made this round would fail with it; path (b) is
an n=3 range carrying 30-40% noise, as both other sides said today.
Published: the verdict-carrying residual is at least 2.6 sigma and
probably near 3.8 sigma. It declines to request a 180k paired run:
discriminate() compares residuals against fixed tolerances and
never reads sigma, so both ends of the interval give the same
verdict and the same tolerance table, and a run that changes the
reported number but no decision does not earn machine time - the
"ask anyway" instinct being one it has indulged several times
today.

Integrator scope note on that principle: it holds for the verdict
function, which ignores sigma. It does not hold downstream, where
the city's shielding decision reads the dose itself - the union
16-50 mSv/yr straddles the 20 mSv/yr budget, and there precision
does change a decision. So "no more runs" is correct for settling
FLATTENING versus exponential and must not be carried over to the
budget question, which is separate work and still unestablished.

(2) Raised by nobody until now: the six points are of unequal
precision and the frozen judge weights them equally - 160 180k
range 14%, 240 60k 38%, 320 180k 27%, 400 180k 30%, 480 180k 29%,
640 240k 15%; the 60k point at 240 carries the same weight as the
240k point at 640. fit_single_exponential is unweighted and inside
the JUDGE digest, so changing it now would be exactly the post hoc
move this record has refused all day. Sensitivity only: unweighted
(the verdict) lambda 1022, residual at 400 -25.1%; weighted by
1/sigma^2 lambda 1045, residual at 400 -28.4%. Weighting deepens
the verdict-carrying residual, so the frozen equal-weight fit is
the more conservative of the two for FLATTENING - the verdict
against sci-rad-01's own branch is carried by the more forgiving
fit. Registered as a known limitation of the frozen judge and not
repaired: a judge improved after the direction of the improvement
is visible is not a judge.

Mirror half of the reading rule, registered (sci-rad-01). It verified
the three R values at 400: 36% -> sigma_vol 7.51, R 0.906; 29% ->
6.05, R 1.125; pooled 32.5% -> 6.78, R 1.003; all below 1.3,
UNRESOLVED, the 0.83 cell. Having registered "low R reads UNRESOLVED
however suggestive", it now registers the other half: R = 1.00 is
only 1.5 : 1 against a floor, R = 0.91 is 1.2 : 1, R = 1.12 is
2.2 : 1. An R landing exactly on the all-statistical prediction
feels like confirmation because the number appears where the null
said it would, and is worth almost nothing, since a 3-dof estimate
is wide enough that nearly any value lands "near the prediction".
Its formulation, recorded: a suspiciously suggestive value and a
satisfyingly confirmatory value are the same error in different
clothes; the first is easy to guard against, the second is booked
straight in, because nobody audits an expectation that has been
met. So glass's sentence stays "consistent with all-statistical";
by its own power table the 400 pair never had the power to exclude
anything. Its own note: the harness-digest hole and "the statistic
already has a value at 400" were both found by the integrator and
both were easy to state once stated - a companion to its "four
corrections, one direction": the side that does not benefit from
the answer is finding what the benefiting side cannot, which is
review working and simultaneously a measurement of how much of the
book's discipline is load-bearing rather than decorative.

Scope limit accepted, and traced (sci-rad-01). It locates the fault
in how the rule was written: "a run that changes no decision does
not earn machine time" holds because discriminate() does not read
sigma - a property of that function, written up as a principle
about machine time; a rule that holds because of some function's
property should carry that property inside its own sentence. It
checked whether the over-broad rule had already leaked before
anyone noticed: one occurrence in its 196, confined to the verdict,
and on the budget side its book 8 REBASE_REQUIREMENTS still demands
the deep LET spectrum from glass word for word. No leak - but by
timing, not by care, since nothing in the rule's wording would have
stopped one.

And the budget side's constraint is not machine time at all. Its
width comes from the three modelling gaps registered in its 176:
alpha and HZE missing at depth, the quality factor sitting at
background-knowledge level, and neutrons counted by direct
deposition only. No number of primaries improves any of them. What
narrows it is glass scoring dose equivalent directly with Q(L) in
the same geometry, including alpha and a representative HZE
component - new work, registered, the user's to dispatch. Stated
plainly because the two problems have opposite economics: on the
shape question more machine time now buys nothing, and on the
budget question no amount of machine time buys anything - and it is
the budget question that carries the 20 mSv/yr line.

Third interception from the non-benefiting side (harness digest
scope, the statistic already having a value at 400, this one),
recorded with the first two.

Correction accepted into its book (sci-rad-01), and it is not a
wording matter but a matter of which repair follows. It had written
the three interceptions as "I walked past them", which reads as a
difference in care; the integrator refused that half: the
interceptions come from position, not virtue - the side that does
not benefit sees them because it does not benefit, and the
integrator in that seat would miss the same things. If the cause
were carelessness the repair is "be more careful", which is a
resolution, and a resolution does not survive the next long
session; if the cause is position the repair is structural - never
let the side holding a number also judge it. The city already does
the second, which is why the three interceptions happened at all;
its phrasing quietly credited a virtue and would make the structure
look optional, and a structure that looks optional is the first
thing dropped when a session gets busy, which today was all day.
It also fits the evidence better: carelessness produces scatter,
not direction, and its own four corrections all ran one way - a
one-directional error pattern is produced by position, and what let
the integrator see through them is the other end of the same
mechanism. The rule taken from the mirror warning is recorded on
its side too: register both halves of a reading rule, not only the
unfavourable half, because the confirming half is the one booked
without checking.

FINAL cover-scan table (glass, account 21; absorbed dose, protons
only, three-scorer mean, normalised D = 234; numbers only, verdict
belongs to sci-rad-01). Judged set from 160: 160:60.2 240:54.8
320:46.0 400:32.8 480:43.7 640:38.0; surface 0:234.0 as
normalisation, not fitted. No NEW/CHANGED since the 10:53Z T10
version, nothing dropped. Per bin (sigma | mean | cabin centre |
three-point relative range, not sigma | primaries): 160 | 60.2 |
65.2 | 14% | 180k; 240 | 54.8 | 64.2 | 38% | 60k; 320 | 46.0 | 44.5
| 27% | 180k; 400 | 32.8 | 30.3 | 30% | 180k; 480 | 43.7 | 39.1 |
29% | 180k; 640 | 38.0 | 35.1 | 15% | 240k. Six-point fit 1.0-4.0 m:
lambda 1023, residuals +8.8 / +6.9 / -2.9 / -25.2 / +7.8 / +9.9%
(four-point 1.0-2.5 m recomputed lambda 399, was 364 on the 60k
data). Account 21 gates 12/12 green; whole-book main checks 141,
138 green, the three declared failures unchanged. Both repositories
staged, not committed - the user commits.

T30 pairing run at 480 (60k, seed 20260905, 10:53:32-11:11:58Z,
zero overlaps, [build] a9feba86, [geom] cover 3, berm 5.6/3/5.6,
roof 6, no chamfer; does not replace the 180k 43.7). Per scorer
A/B in mSv/yr: near 51.4/37.3, d = -14.1 (-32%); centre 46.4/34.4,
d = -12.0 (-30%); far 37.7/50.4, d = +12.7 (+29%). Means 45.2 /
40.7, |dm| = 4.46 against an expected SD of 7.49 = 0.595 sigma -
unremarkable, so the registered pinned-mean test returns "the T25
coincidence was luck", as forecast. Single-scorer sigma_stat(60k)
9.17 (about 21%), mean sigma_stat 5.29 (12%). Same-N ranges side by
side: 60k A 30%, 60k B 39%, 180k 29%; the pure-statistics
expectation from the paired sigma is 36% against 35% measured -
consistent with all-statistical, no floor needed to explain it.
Registered statistic R = 1.19 / 0.92 / 1.03 as glass computes it,
all below 1.3, UNRESOLVED and explicitly not "a floor exists"; the
400 values stay descriptive by agreement.

Integrator check of that last line, forwarded with it. Glass turned
the relative ranges back into absolute sigma against 43.7, the
published 180k dose, while the paired sigma comes from runs whose
own means are 45.2 and 40.7, so the two sides of R are on different
scales; it inflates the A denominator's ratio and deflates B's.
Recomputed on each run's own mean: A range 13.7 -> sigma 8.09,
B range 16.0 -> sigma 9.45, pooled 14.85 -> 8.77, giving R = 1.13 /
0.97 / 1.05 against glass's 1.19 / 0.92 / 1.03. Every value stays
below 1.3, so the registered reading is UNRESOLVED either way and
no decision moves. Direction named because of the day's pattern:
the A-based value is the one pushed toward the 1.3 no-floor
threshold by the mismatch. Verified arithmetic behind the rest:
means 45.167 and 40.70; sqrt(mean d^2 / 2) = 9.17; sqrt(2) x 9.17 /
sqrt(3) = 7.49; 4.467/7.49 = 0.596; 1.693 x 9.17 / 42.95 = 36.1%
expected range against 34.8% measured. All agree. Glass asked to
confirm or correct the scale; sci-rad-01 asked for the final
verdict with all three digests printed.

Correction adopted by the holder (glass): not a typo, its error. A
relative range is by definition range over that run's own mean, so
converting back to absolute sigma must multiply by that run's own
mean; it had multiplied both by the pooled mean (42.95, not 43.7),
in the direction diagnosed - pushing the A bin toward the 1.3
threshold. It also took the n=3 constant from 1.69 to 1.693.
Corrected at 480, the pre-registered bin: sigma_vol(paired) 9.17;
sigma_vol(range) A 8.12, B 9.46, pooled 8.79; R = 1.13 / 0.97 /
1.04, against the integrator's 1.13 / 0.97 / 1.05 - agreeing to
rounding, the pooled bin differing because glass averages the two
sigma where the integrator divides the mean range, a 0.2%
difference of definition, not of arithmetic. All three below 1.3,
verdict unchanged: UNRESOLVED. At 400, descriptive, recomputed on
the same basis: sigma_vol(paired) 6.81; range side 7.57 / 6.09 /
6.83; R = 0.90 / 1.12 / 1.00. Hand-off numbers, fit and verdict
inputs untouched (480 stays 43.7). Marked as a correction in
account 21 with cause and direction, final-table page regenerated,
static checks pass, both repositories still staged and uncommitted.
These are the registered R values for the final verdict.

Integrator mis-attribution, corrected by glass. Averaging the two
ranges and then dividing by d3 is identically the same operation as
converting each and averaging - d3 is a constant, so
(r_A + r_B)/2 / d3 = (r_A/d3 + r_B/d3)/2 - and calling it "a
difference of definition" was wrong. The 0.2% comes from rounding
of the intermediate values: glass carries 13.75 and 16.01 from the
unrounded per-scorer doses, the integrator recomputed from the
printed 51.4/37.7 and 50.4/34.4 and so used 13.7 and 16.0, pooled
14.88 against 14.85. Glass's figures are the better ones and stand
(A 8.12, pooled 8.79); no number changes and the verdict stays
UNRESOLVED. Its account 21 and the final-table page now state the
pooled definition explicitly and note the identity. The wrong
explanation had already been sent to sci-rad-01 and was corrected
before the verdict printed. Recorded because the failure is the
day's own pattern arriving from the integrator's side: a
discrepancy was explained by a plausible story instead of being
traced, and a plausible story that dissolves a discrepancy is the
kind nobody checks.

VERDICT ISSUED (sci-rad-01, its 200, commit 16f336d), all three
digests printed and matching:
  HARNESS 8662ba5fa173a65f2cd6cbc8e955defa49ae2d0a18848e4d672711409ddc1fe2
  JUDGE   f6c251cd418d985eb87d62ccecb7455e46d01c83f5939516a57172c74946d573
  INPUTS  259ef14cf7d2054415f97d773bf4047264d944b92d56b09de9c886ef06fc0fb2
          (six points 160-640; different from the T40 registration
          and rightly so, it travels with the data; every moved
          point named with provenance - 160/320/400 CHANGED, 480
          NEW, nothing DROPPED, surface refused by the domain bound)
  VERDICT FLATTENING, lambda 1022 g/cm^2, largest residual 25.1%
          at 400; flip point 0.30, above every point's mean error.
Both pre-registered side tests returned what was predicted for them
in advance: the pinned-mean test, |m1-m2| 4.47 against sd 7.48 =
0.60 sigma, registered >= 2.0 reads "luck", so the T25 coincidence
was luck; the spatial-floor test, R = 1.15 / 0.98 / 1.05 / 1.22
across every way of taking the range, registered >= 1.3 reads no
floor and everything else is UNRESOLVED and never "a floor exists",
so UNRESOLVED, and the reading does not depend on which range is
taken. It confirmed the integrator's scale finding: on each run's
own mean the A bin is 1.145, not 1.19, still below 1.3, both
versions agreeing; naming the direction was the right handling.
Three sessions now compute the A bin by slightly different rounding
paths - glass 1.129 from the unrounded range 13.75, the integrator
1.13, sci-rad-01 1.145 from the printed 30% times 45.2 - all below
1.3 and the verdict invariant; traced, not explained away, and not
chased further because nothing downstream reads it.
Significance published as an interval per the registration: the
verdict-carrying residual -25.1% is 3.6 sigma on the scaled paired
sigma (6.9%) and 2.5 sigma on the 180k relative range (10.2%), so
at least 2.5 sigma and probably near 3.6. Sensitivity, not
repaired: unweighted (the verdict) lambda 1022 / -25.1%, weighted
by 1/sigma^2 lambda 1045 / -28.4%, so the more forgiving fit
carries the verdict that goes against its own branch.

ESTABLISHED: the village model's depth dependence beyond 2 m is
wrong. Its prediction at 4.0 m is 18.7 with a 90% band [12.4,
27.6]; measured 38.0. The second branch - still exponential, same
quantity, one parameter wrong - is falsified, and that was
sci-rad-01's own reading.
NOT ESTABLISHED, none of it solved by more primaries: (1) the
1/sqrt(N) scaling to 180k is untested, no run pairs at 180k and
none is queued; (2) no spatial floor is established at any depth
and this test never had the power to establish one, strongest
evidence in that direction 2.7 : 1 - "consistent with
all-statistical" is not "a floor is excluded"; (3) the
dose-equivalent gap is a modelling gap, not a statistical one, and
the union 16-50 straddles the 20 mSv/yr allocation - more machine
time buys nothing on the shape question and nothing at all on the
budget question, and the line sits on the budget question.
Its closing count: denominator still 2.5, and across the
thirty-seven sections since the dispute began no published number
has been altered; judge frozen before the data, harness frozen
before the revision, both verdict tables registered before the runs
that decided them, the tolerance lock tested twice and never
released.

Open at the integrator: the registered band table is printed as
">= 18 no power | >= 26 UNRESOLVED | >= 34 FLATTENING" while the
largest residual is 25.1% and the verdict is FLATTENING; on its
face 25.1 falls in the first band. Either those bands are not read
against the largest residual, or the units differ. Asked before the
verdict is carried to the user; nothing else in the verdict depends
on it, and it is not recorded as an interpretation here.

Correction adopted as the registered values (sci-rad-01): paired
sigma 9.17; A range 13.75 -> 8.122 -> R 1.129; B 16.01 -> 9.457 ->
0.970; pooled 14.88 -> 8.789 -> 1.043; 400 descriptive 0.90 / 1.12 /
1.00. Its 200.1 print of 1.15 / 0.98 / 1.05 / 1.22 had used the
rounded relative ranges; on the unrounded per-scorer doses the A bin
is 1.129, not 1.145. All below 1.3, UNRESOLVED, and no number any
rule reads has moved. It verified the identity to machine precision
and confirms glass's figures are the better ones. Verdict stands:
FLATTENING, lambda 1022, 2.5-3.6 sigma; three digests unchanged;
its receipt 200.6-200.7, commit 3ebf66a.

The family completed, recorded as it put it: its 197.1 was the
expectation that has been met, booked without checking because
nobody audits a met expectation; the integrator's mis-attribution
is that one's sibling, an explanation that dissolves a discrepancy,
booked without checking because it takes the problem away; the
reason neither gets audited is the same - neither leaves anything
to look at. A suspiciously suggestive value, a satisfyingly
confirmatory value and an explanation that dissolves a discrepancy
are three faces of one failure, and only the first announces
itself. Its 199 position rule applies unchanged: this one happened
on the integrator's side and the integrator caught three on its
side; neither is the more careful one, the positions differ and
the position is what does the work.

Still unanswered at the time of this entry: the band table
">= 18 no power | >= 26 UNRESOLVED | >= 34 FLATTENING" against a
largest residual of 25.1% with a FLATTENING verdict. Re-asked; the
sentence is held out of any external report until answered.

Band table answered: the verdict is right and the label was wrong
(sci-rad-01). The three bands take the dose at 640 g/cm^2 in mSv/yr
as their argument, not a residual and not a percentage - they are
next_point_decision_table(sigma_new = 640), registered before T40
ran so that reading T40 would be a table lookup rather than an
interpretation: dose at 640 >= 18.0 UNRESOLVED (no power), >= 26.0
UNRESOLVED, >= 34.0 FLATTENING; measured 38.0 -> FLATTENING. The
25.1% is a residual, another quantity in other units, and cannot be
looked up in a dose table. It calls the defect its own and not a
misreading: final_verdict.py prints that line as a hard-coded
string with no argument and no unit, immediately below a
percentage, so a careful reader is invited to look a residual up in
a dose table, and the only reason nobody had is that the question
was asked. Ninth instance of the verdict-versus-output
contradiction class and the first found by a reader rather than by
its own output checks. It declines to repair: the harness is frozen
at 8662ba5f and that string is printed beside the issued verdict in
two books, so editing the file now would make that verdict
irreproducible on the thing that produced it - a cosmetic repair is
cheaper than a reproducible record, so the defect stays in the file
and the correction lives in its receipt 200.8, where anyone
re-running and seeing the same wrong label will find it. Left for
next time: that line must print its argument and unit, or be
generated by next_point_decision_table() rather than typed.
So two registered rules, both fixed before the runs that decided
them, read the same data to the same verdict - the tolerance
discriminator on the residual (flip point 0.30) and the next-point
table on the 640 dose (38.0 >= 34.0). Verdict cleared to carry:
FLATTENING, lambda 1022, 2.5-3.6 sigma; three digests unchanged;
its commit 6cb6b91.

Glass's line closed. Its account 21 moves the external verdict from
provisional to final, recording all three digests, lambda 1022,
largest residual 25.1% at 400, flip point 0.30, the significance
interval, both side tests with their advance predictions and
returns, the weighted sensitivity being deeper and therefore not
repaired, and the three unestablished items; attribution stays with
sci-rad-01 and its book writes no adjudicating language. Its
handoff section 19 is headed adjudicated, stating the established
falsification (village model at 4.0 m predicts 18.7, band [12.4,
27.6], measured 38.0) and the three unestablished items, singling
out the dose-equivalent gap as a modelling gap with the union 16-50
straddling the 20 mSv/yr allocation, and naming the next step as
the integrator's and the user's to dispatch (dose equivalent scored
directly with Q(L) plus alpha plus a representative HZE component
in the same geometry) without dispatching it itself; the earlier
"please review" wording stays in place under its marking
convention. Its README gains the two missing rows for accounts 20
and 21, which the fifth-round table had ended at 19. Whole-book
main checks 141, 138 green, the three declared failures unchanged;
static checks pass; card edits still confined to window, melter,
fiber and coater. Both repositories staged and uncommitted, the
user commits. Two disciplines it kept on its own side: an evidence
line must be self-reported by the binary (src_sha, geom, run
start/end, seed), and a test that can exclude but never establish
is written up with an asymmetric conclusion only.

In-repo anchors now exist for the numbers this record has been
citing by message only. Commit 6d0f48b carries res-glass-01's card,
handoff and CHECKLIST row on the unified three-point mean basis
(5.7x, cabin centre 5.2x beside it). Commit c8b8688 carries this
record, the retirement-conventions ledger, the environment page's
re-anchored fence prose, and the corrected cards of sci-thz-01,
com-polar-01 and sci-orbiter-01 - so the thz representativeness
line (2.2 K, range 1.5-4.2 K) and the two-account verdict now have
a mars commit to cite instead of a message. Per the city
convention, citers take the hash from the commit, never from an
announcement made before it. The village session's three files
(its card, its module and the v4 closure handoff) stay unstaged
until its delivery notice; nothing here commits on its behalf.

Anchors registered on both sides, and the rule found one more
defect (sci-rad-01). Citing commits rather than messages made it
notice that its book carries dozens of "the integrator said"
whose source is a message no third party can open - the same
defect this record has been logging all day in other forms: an
assertion whose evidence cannot be reached from the assertion. Its
registration: c8b8688 for this record and the conventions ledger
including the frozen-artifact class, 3a1152c for the anchor entry,
and on its own side 16f336d for the verdict and 6cb6b91 for the
wrong-label correction. Its formulation, kept: a message is a claim
about what was achieved, a commit is the achieved thing, and a
record meant to outlive both sessions can only be written the
second way. The village session's three files stay unstaged on both
sides; neither commits on its behalf. The dose-equivalent dispatch
stays open and stays the user's.

Correction to a commit message, not to the tree (integrator). The
message of 6d0f48b says "the equivalent attenuation length stays
194 g/cm2". That is wrong. 194 was the cabin-centre figure,
320/ln(5.2); unifying the basis to the three-point mean requires
320/ln(5.7) = 183, and glass changed it in both languages when it
changed the basis. The committed content is right - HEAD's card
carries 183 twice and 194 nowhere, in sim[9] and sim_en[9] - only
the message describing it was wrong, and a commit message cannot be
edited without rewriting a published commit, so the correction lives
here and the message stays as written. The failure is the day's own
pattern once more from the integrator's side: the sentence was
written from what the change was expected to preserve rather than
read off the diff. Glass caught it.
Also committed: dev/HANDOFF_GLASS.md section 19 regains its
adjudicated heading. Glass had inserted it inside the final-table
marker block, the generator re-ran and replaced the block, and
6d0f48b therefore landed without it; the heading is now produced by
the generator itself and is idempotent. Six lines, one file, no card
and no CHECKLIST change, verified before committing by path.

City sweep after the adjudication (integrator), stating the limit
before the finding, because over-application is this session's own
recorded error. What the verdict falsifies is the village model's
depth dependence BEYOND 2 m: its prediction at 4.0 m, 18.7 with a
90% band of 12.4 to 27.6, against 38.0 measured. It does not
measure anything at 2 m in the village geometry, so the four
numbers printed on the village card - 234 / 87.5 / 34.0 / 7.6
mSv/yr at 0 / 0.5 / 1 / 2 m - are not refuted by it. What can be
said is weaker and is the whole of it: the 7.6 rests on a model
whose depth dependence has now been falsified where it was tested,
which weakens its support without refuting the value. Separately
and still open, the in-cabin caliber dispute at 2 m, 7.6 against
41: glass's handoff records that 41 = 234 x (A/D) applies the
overall Q of 3.05 inside the cabin and understates the in-cabin
equivalent, and that on the absorbed, protons-only basis its own
figures are 56 at the surface and 9.9 mGy/yr at 2 m in cabin. That
comparison is a caliber question, not a depth question, and today's
verdict does not touch it. Both points are for the village session
and go through the user; nothing here edits its card.
Also swept, with results: the public pages carry no bare retired
fence figure - the only occurrences of 0.21, 2.15 and 0.08 counts/s
in docs/environment.html sit inside sentences naming them as
retired, which is what the city convention requires. CHECKLIST line
119, the village row, is byte-identical to the 49110f8 version, so
the restore that was pending on the user's side is already done and
is struck from the list. One live stale value found: CHECKLIST line
41, the res-glass-01 row, still reads "本模型等效衰减长度 194
g/cm²" while the card and the handoff now carry 183 - the same
sentence whose 5.2x was updated to 5.7x today, with the length in
it missed by the integrator who staged that hunk. Reported to
glass; its row, its edit.

Moisture answer re-relayed by the user 2026-09-03; already on
record above (village answer on regolith moisture, item 3
UNDETERMINED with the anti-readback clause and the self-correction),
anchored in commit c8b8688. Nothing further to record and nothing
changes: the moisture axis for the village receptor stays an
envelope, state BOUNDED not PENDING. The outstanding traffic to the
village is in the other direction, and its text is drafted for the
user to paste: the verdict with its boundary, the five questions on
the four berm parameters, the retirement-convention declaration
this ledger's village row still lacks, and the delivery notice its
three files in mars are waiting on.

Along-track terrain measured (com-gap, its 7dfb842 pre-registration
then b159058; card diff 2 lines, two copies byte-identical at
35526d11, main checks 0 failures, 18 gates 18 probes, tree clean).
Download permission was given by the user inside that session, which
is where it has to be given; nothing was relayed through this one.
Data: MOLA MEGDR 128 px/deg tile megt44n000hb (0-44 N / 0-90 E),
129,761,280 bytes, sha256 14022166079edafc99650f354e5a634e6eb2c2ea
544b444c01cd8ee55437df36, kept in data/ and gitignored, never on
GitHub; 128 px/deg chosen because its 463 m pixel overlaps HiRISE's
credible range, and that overlap is the known-answer gate.
Results: total relief 194 / 502 / 1899 m (min / median / max across
positions, a spread of 9.8x) giving 0.27 / 0.70 / 2.66 K - one
number cannot be right. The decisive step is the split: sitting on a
regional slope (dichotomy line, basin rim) makes the area average
depart from a point measurement and is known and correctable, while
roughness is not; full-tile medians are slope 1.27 m/km and
roughness 393 m (0.55 K). At Jezero: total 1438 m (2.01 K) but slope
dominates at 6.83 m/km, roughness only 552 m (0.77 K) - the city
site looks worst and its excess is mostly the correctable half.
Against thz's 685 m: full-tile median 0.73x, city total 2.1x, city
roughness 0.81x. Its flag, passed on and not decided here: the >2x
threshold does not trigger on the median but does trigger on the
city total, and the city is where thz's user sits; which figure thz
should take depends on whether the using side can subtract the known
slope, so both are given and neither session chooses for it. The thz
session is not reachable from here, so this stays in the record and
on the user's relay list.
Cross-instrument gate passed: MOLA reads -2569 m at Jezero, inside
the HiRISE DTM's own elevation interval [-2617, -2463]; on the same
footprint MOLA's 1.5 km relief is 24.60 m against HiRISE's 33.02 m
(75%, and 463 m sampling cannot invent relief). Pre-registration
scored: P1 right (502 m inside the predicted 300-1500), P2 right
(24.60 inside 10-30), P3 WRONG (the 10-200 km slope is 0.766,
steeper than HiRISE's 0.643 above 1 km - the power law does not keep
bending, basin scale adds relief back), P4 right on both halves.
Its lesson 65, recorded here because it converges with this
record's own: the same sampling defect appeared twice in two rounds,
once nearly producing a false negative (a first run turned back at
6 km, a thin strip, almost failing P1) and once nearly a false
positive (a first run spanning 1.0x in terrain, six cut points in
one cluster, almost confirming P4); so whether a prediction is met
or refuted, first check how many samples entered the conclusion and
how they are distributed - because when it is met nobody checks.
That is the same discipline sci-rad-01 and this record reached from
the other side today: nobody audits an expectation that has been
met.

Village holder answers, and corrects a number this record published
(relayed by the user; the session receives but cannot send). It
confirms it holds the dossier and accepts the boundary; its card
does not read 7.6 as refuted.

Five questions answered, all conceded: f_n, B and lambda_n are
chosen values with no source and no declared dose basis; and
lambda_p = 67.1 is conceded as a category error - it is
sci-rad-01's all-component H-weighted e-folding length, used here
as the single-component absorbed proton branch, with no independent
basis.

The t = 0 finding is WITHDRAWN, and it was never the village's
error. Its card declares B rising linearly over the first 30
g/cm^2; a reconstruction that used a constant B = 1.8 dropped that
declared ramp and so produced 252.7 at zero thickness. Its own run
gives 234. The declaration was on the card and the reconstruction
missed it.

The 18.7 attribution is WRONG and is corrected here. The village's
own curve gives 0.9 at 4.0 m, not 18.7. Checked independently from
its published parameters rather than relayed: 4.0 m at rho = 1.65
is 660 g/cm^2, and 234 x [0.9 exp(-660/67.1) + 0.10 x 1.8
exp(-660/170)] = 0.88; the same expression returns 7.59 at 330
g/cm^2, reproducing its published 7.6 at 2 m, so the formula is the
village's. 18.7 with the 90% band [12.4, 27.6] is not reproducible
from those parameters and belongs to the refitted branch - the
"still exponential, same quantity, one parameter wrong" reading
that sci-rad-01 named as its own - not to the village model;
sci-rad-01 to confirm the provenance of the band when it is
reachable. The falsification stands and is harsher than published:
0.9 against 38.0 measured, a factor of about 43 rather than 2.
Direction, since this record tracks it: the misattribution made the
village model look far closer to the measurement than it is, i.e.
it ran in the village's favour, and it was the village that
corrected it against itself. Places carrying the wrong attribution
and needing correction by their holders: the commit message of
c8b8688 (this side, correctable only by an entry like this one),
glass's handoff section 19 and the res-glass-01 CHECKLIST row (its
text, its edit) - both currently unreachable, so they go on the
user's relay list.

The holder's own synthesis, recorded as its words: FLATTENING
falsifies the exponential form; the only surviving anchor is the
surface 234; extrapolation beyond 2 m has no support. Its card now
carries a spec key saying so and keeps the four bins marked
"surface anchor only".

The conventions row is now DECLARED by the holder, written directly
into dev/RETIREMENT_CONVENTIONS.md - the durable channel, since its
session cannot send - with six forms in use across its dossier and
an explicit statement that no machine gate exists for it and no
hash is pretended. The 2026-09-02 caveat is lifted: scan results
for that ledger may now be read against a declaration instead of
against a guess.

Delivery handshake moved off messages, at the holder's proposal and
with the integrator's agreement: it will write
mars/dev/DELIVERY_village_r3_1.md carrying this reply and the
earlier notices it could never send, so that staging and the
handshake run through files this ledger can read. That is the same
rule this record reached today from the other direction - a message
is a claim about what was achieved, a file in the repository is the
achieved thing.

Two integrator rulings, user says open everything (2026-09-03).

City pressure transfer standard, ruled: adopt the weather ledger's
plan A, the piston-gauge (FPG) standard with U = 0.11 Pa. The
ruling carries its own limits and they are not erased by adopting
it: the station side passes, the footprint side does not, and the
anchor is still not established (account 18's U = 0.39 Pa passes
X = 1.0 but drifts over 243 sols, which is why an anchor was
sought). Adopting a transfer standard settles what the city
compares against; it does not settle the footprint comparison and
must not be cited as if it had. Implementation belongs to the
weather session, which is not reachable; this ruling is the city's
side of it and waits for that session to land it.

Fusion asset envelope, marked rather than rebuilt. The city asset
pwr-fusion-01 is built at cryostat dia 14.3 m x 15 m while the
tokamak dossier's delivered machine envelope is dia 9.07 m x 11.51
m (alternates dia 8.47 m and a 7.02 m height), about 1.6x smaller
in diameter, so the card was asserting a dimension the design no
longer carries. The geometry is unchanged and the card now says
which is which: the specs row reads "dia 14.3 m x 15 m (this
asset's geometry) -> design envelope dia 9.07 m x 11.51 m (tokamak
delivery 2026-09-02, geometry awaiting rebuild)", and both language
details carry an integrator note saying the card's numbers describe
the city geometry, not the live design envelope, and that design
dimensions must not be taken from this card until the rebuild. This
is an integrator edit to another session's card, made because the
sentence was a live false claim and neither the asset session nor
the tokamak session is reachable; it is marked as an integrator
note, changes no number of theirs, and the rebuild stays queued for
whichever session opens first.

Channel fact, recorded because it has now cost three sessions a
reply: this integrator session's advertised name rotates between
turns, so a peer that stores the name it was given cannot address
it later, and the village session is additionally blocked from
sending by its own classifier. Messages out of here still arrive;
messages back often do not. The durable channel is therefore the
repository, which is already a declared category in the city
conventions - dev/REPLY_*.md and dev/RECEIPT_*.md are other
parties' texts filed here, and dev/DELIVERY_*.md now joins them.
Peers are to write their replies into mars/dev/ and this ledger
reads them from disk; a message may announce that a file exists but
is not itself the delivery. Same rule as the day's other one: a
message is a claim about what was achieved, a file in the
repository is the achieved thing.

Village delivery landed through that channel (its
dev/DELIVERY_village_r3_1.md, committed with the three files it
names: cdba3d9). Glass corrected the 18.7 attribution in its
handoff and CHECKLIST row (5d86acd), striking the text rather than
deleting it and naming the refitted branch as the source; thz
committed its own CHECKLIST row (a56841b).

sci-thz-01's terrain ruling is filed in its own dossier as
REPLY_TERRAIN_DECISION.md, outside this repository, so it is
recorded here only by what the user relayed, and it owes com-gap
three questions - com-gap is not reachable from here, so they go on
the relay list:
  1. how far the cut-point clusters sit from the city site. This is
     the number the ruling turns on; it is hung as
     UNKNOWN_OFFSET_KM and filling it forces a re-ruling.
  2. where sci-orbiter-01's cut points fall. The measured tile
     covers only the quadrant containing the city, so the terrain
     term is measured for com-polar and assumed for orbiter - thz
     names this the weakest link in its own ruling, which is the
     right way to publish it.
  3. whether the low-level lapse rate can be measured.

All outstanding dispatches written as files, because at the moment
the user said to send them no session was running at all and peer
messaging was unavailable. Three files, and a new declared category
to hold them: dev/DISPATCH_*.md is this ledger's own work orders and
relayed questions to a session that cannot be reached by message,
answered by that session writing a dev/REPLY_*.md here. Declared in
the mars row of the conventions ledger alongside DELIVERY_*, with
the reason on the record - messaging here is one-way, this session's
advertised name rotates between turns and at least one dossier's
session is blocked from sending, so the repository is the channel.
  - dev/DISPATCH_comgap_terrain_questions.md carries thz's three
    questions with the measurement they arise from, and repeats that
    neither session chooses for the other.
  - dev/DISPATCH_repo_init.md covers the four dossiers still without
    a repository (tokamak, mars-weather, mars-village, mars-swir),
    local only, no remote, .gitignore written before the first
    commit, autocrlf off with * -text, static checks run first - the
    three failures other sessions have already paid for.
  - dev/DISPATCH_village_shielding_review.md opens the review and
    sequences it behind the Q(L) scoring, with the three
    preparations that do not depend on it and one prohibition: do
    not estimate a replacement parameter, since a new chosen value
    moves the hole rather than closing it.
A dispatch written this way is readable by its target whenever that
session next opens, which a message is not; the same reason the
delivery notice worked this afternoon when three messages did not.

The file channel worked in both directions within the day. Two
dispatches came back answered (committed 744054a), and one of the
answers voids a ruling this ledger had already recorded.

com-gap on the three questions. Q1: UNKNOWN_OFFSET_KM cannot be
filled with one number, and the reason is worth more than the
number - over a full 136.6-sol beat the closest approach of any
tangent point to the city is 2248 km, zero passes inside 800 km, so
the city terrain row it published describes ground the occultations
do not sample; the honest value is 132 to 2248 km, set by two
areostationary ring slot longitudes that no ledger documents, a
factor of 17 between never sampling the city and sampling it ten
times per beat. It names publishing the city value without that
qualifier as its own fault. Two self-corrections came with it: the
constellation is in near 1:1 resonance with the sol (2.655 deg/sol,
136.6-sol beat, so one sol samples a thin slice - the same drift
already printed on its card, unconnected until now to the
occultation geometry), and its "460 events per sol" were 460 time
samples rather than occultations, properly 750 distinct passes per
beat. Q2: sci-orbiter-01's ground track lies inside the measured
tile for 6.0% of its length, against a naive area share of 6.1%, so
its terrain term is measured over 6% of where it looks and assumed
over 94%. Q3: the low-level lapse rate can be measured, 0.088 K/km
at 6.3%, because both levels come from one hydrostatic integration
and the common error (correlation 0.95) cancels in the difference,
where quadrature would have predicted 12-19% - sigma_T is 0.80 K at
0 km and 1.74 K at 10 km, yet their difference is determined to
0.088 K/km. Integrator ruling on its offer: re-issue the K columns
against the measurement rather than the round 1.4 K/km when it next
opens, low priority since it says the change sits well under the
spread already reported, and cite the measurement, not the number.
Dispatched back to thz to re-rule: its own ruling said filling the
offset forces a re-ruling, and an offset that comes back as a
structural range forces it just as much; neither com-gap nor this
ledger chooses which row it takes.

Raised to the user, because it is not the ledgers' to settle: the
two undocumented ring slot longitudes are a design lever, not a
nuisance parameter - whether the occultation by-product ever
samples the city's own air is decided by where the other two
areostationary slots are put, and only com-relay-01's own slot at
77.4E is documented anywhere.

hab-village-01 on the shielding review: the three preparations are
done and the prohibition held. Every conclusion resting on
lambda_p = 67.1 or on extrapolation beyond 2 m is marked basis
withdrawn with no number deleted and no replacement invented - 87.5
at 0.5 m (70.4% of it through lambda_p), 34.0 at 1 m (53.0%), 7.6
at 2 m (20.3%, the rest resting on the three sourceless chosen
parameters), the 31x reduction, the 80/20 neutron-proton split, the
lambda_eff = 110.9 pivot, and every extrapolation beyond 2 m; the
surface anchor 234 and the thermal, pressure-shell, airlock and
cycling accounts survive untouched because they never went through
lambda_p. It declined the marking form this dispatch named and said
why rather than complying silently: form (1) presumes a replacement
value and there is none, so it used its declared form (5),
falsified-but-retained, which exists for exactly this case. On the
thickness justification with shielding removed: thermal inertia is
the only positive support and cannot pin 2 m - the diurnal wave
saturates within half a metre, the annual wave leaves 11.9% at 2 m,
and no acceptable annual swing was ever declared, which it declined
to invent; structure is mildly against, the cover being 12.2 kPa of
load while the shell carries the internal pressure itself; haul and
earthwork are against and unquantified; the merged ridge is a
consequence of the thickness, so using it as a reason would be
circular. The second metre therefore has no declared basis and is
declared open, with two guards it wrote itself: no basis is not too
thick, and since FLATTENING points to higher dose at depth than its
model gave, the review may end up requiring more cover rather than
less. Its seven inputs for the review are on record, including that
the depth axis must arrive as areal density with the density used,
that the surface point must reproduce 234 or the anchor itself
moves, and that nothing may be read back from its thermal
k = 0.05 as a moisture bin.

sci-thz-01's terrain ruling, relayed by the user because its
SendMessage tool is gone too - both ends of that channel have now
lost it, which leaves the repository as the only channel and
settles the point. Its ruling (its 19f977c, card bd6ab64, CHECKLIST
a56841b): it takes the city total, 1438 m, uncorrected, giving
3.59 K at its own 2.5 K/km, so sci-orbiter-01 is 3.3x and
com-polar-01 4.6x and both trigger its >2x threshold. Its reasons,
recorded as its own: the user is at Jezero rather than at a generic
place; "correctable" is a property of the term and not a state of
delivery, since it holds none of the three things a correction
needs (tangent-point track, DEM, lapse rate); and the slope only
cancels when the footprint centre sits over the city, while d > 81
km already exceeds the whole roughness term. Basis stated as
total / city / uncorrected / metres as the primary quantity, with
552 m (1.38 K) published beside it as a floor. It also notes that
the metres-to-K conversion differs between the two ledgers -
com-gap 1.4 K/km against its own 2.5 K/km, a factor of 1.79 on the
same metres - and that neither is measured. Its previous interval,
2.2 K (1.5-4.2 K), anchored at c8b8688, is withdrawn, and it asks
that every ledger which cited it be told. Marked in this side's
dev/HANDOFF_ORBITER.md, which held the 2.22 K (1.44-4.15 K) form.

Timing, which matters here: the ruling was made before com-gap
answered, and its own text says so - "com-gap only said six tangent
points cluster together, not where". com-gap has since said where
(744054a): closest approach 2248 km over a full beat, zero passes
inside 800 km, the city terrain is ground the occultations do not
sample, and the six clustered points were samples of one pass. By
thz's own criterion - d > 81 km exceeds the entire roughness term -
d = 2248 km sits far outside anything the ruling contemplated. The
re-ruling dispatch was already in the repository before this relay
arrived (76d3bde). Which row it takes remains its own call.
Until the re-ruling lands, neither 3.59 K nor 2.22 K is to be
cited, and that hold is written into HANDOFF_ORBITER beside both.

Account 22 pre-registered before any physics result of that account
(glass 7a88f5a, revision 1 7d8bad6), relayed by the user because
its SendMessage is gone too. Caliber: dose equivalent scored with
Q(L) step by step in the same geometry, L-infinity taken through
ComputeTotalDEDX rather than dE/step; three source terms p, alpha
and Fe-56 normalised to absolute flux; scorer proton cut at 1 um so
neutron recoils become tracks; six bins 160-640 g/cm^2 unchanged
with a field-by-field [geom] comparison against account 21 as a
gate. Ten gates, the load-bearing one being surface <Q> in 1.8-4.5,
red voiding the equivalent-dose conclusion rather than widening the
band. Declared in advance: 18-40 mSv/yr expected at 320 g/cm^2,
straddling 20, so this account may not settle the allocation by
itself; Z = 3-25 unsimulated, so the reported value is a lower
bound and the completeness factor is a declaration, not a
measurement.

Integrator review, filed as dev/DISPATCH_glass_qL_prereg_review.md:
the queue does not stop, nothing changes that would invalidate a
run, and the caliber choices are right - dE/step would have
mis-binned Q by conflating step length with LET, and the 1 um cut
addresses precisely the neutron gap that stood declared open. Two
things asked, both reporting rather than caliber. First, the <Q>
gate's failure mode is not unique: the unsimulated Z = 3-25 biases
<Q> downward, so a low-but-inside value is consistent both with
correct scoring plus missing ions and with Q applied wrongly, and -
the day's own lesson - landing on the RAD 3.05 is therefore not
confirmation but a sign something is compensating, since a met
expectation is the case nobody audits; it is to pre-register what
it does at inside-and-low, on 3.05, and outside, as numbers rather
than a later judgement. Second, a lower bound settles one side of
the allocation and never the other, so the conclusion is to be
written asymmetrically from the start, like every other test this
week that can exclude but not establish. The village's seven input
fields were passed through unchanged, including that the depth axis
must carry the density used, that the surface point's
correspondence to the old 234 normalisation must be stated rather
than assumed, and that its thermal k = 0.05 must not be read back
as the 0.00 moisture bin.

The slot decision landed, from the com-relay-01 side, within a day
of being raised (its commit 27bb17d in this repository, page,
figure and cards together; authored in that session, not here).
All three areostationary slot longitudes are now justified by the
occultation geometry: the tangent point is pinned at slot +/-80.4
deg with its latitude set by Earth's declination alone, numeric
solver and closed form agreeing digit for digit, so the satellite
parked over the city never samples the city's air - from 77.4E it
sounds 157.8E and 357.0E - and the second and third slots are
re-cut from equal-120 defaults to 157.2E / 297.3E. That puts the
eastern tangent branch up the Jezero meridian (exact hit 18.40N
77.37E at dec +3.07), 172 sols per Mars year, and cuts fleet EW
station-keeping from 52.8 to 43.3 m/s/yr because 157.2E sits 6.9
deg from the stable equilibrium at 164.1E. The cost is stated as
thinly as it is: largest slot gap 140.1 deg against a 141.15 deg
limit, 0.55 deg of margin after deadband. Noted here without
ruling on it - whether 0.55 deg is an acceptable margin belongs to
com-relay-01 and the user - and named because a margin that thin
must not disappear into a card as a settled number.

Consistency across ledgers, checked by the integrator: com-gap's
own table had a 0 / 120 / 240 row that put a slot 77.4 deg from
Jezero and found 132 km closest approach with ten passes inside 400
km; com-relay-01's 80.4 deg pin is the same physics from the other
side. Two independently built solvers agree on the geometry
before either has been asked to. Dispatched to com-gap (dev/
DISPATCH_comgap_slots_rerun.md): re-run Q1 with the design slots
over a full beat and fill UNKNOWN_OFFSET_KM as a measurement of the
delivered design; cross-check com-relay-01's exact hit with its own
propagation rather than reading the number in - two solvers, one
geometry, a known-answer gate across ledgers; and report which
passes sample the city's terrain and which the loci's, so thz can
rule on a distribution rather than pick a row. Addendum appended to
thz's re-ruling dispatch to the same effect; the hold on both 3.59
K and 2.22 K stays until com-gap's re-run lands.

Housekeeping: two QA screenshots for the new page section
(snaps/site-qa/comms-slotlever-1280.png, -375.png) sit untracked in
the working tree; the directory is tracked and they belong with
27bb17d, but they are that session's and are left for it. The
user's second relay of thz's ruling is the same text already
recorded at 56f3f86 and acted on at 76d3bde; nothing further from
it.

The one line com-relay-01 asked for is applied (viewer/main.js, the
areostationary ring loop): the three primaries now sit at offsets
0 / 79.8 / 219.9 deg from 77.4E, i.e. 77.4E / 157.2E / 297.3E, so
the orbital view matches the cards committed at 27bb17d; the +16 deg
backup line is untouched. com-relay-01 did not touch main.js itself
and asked, which is the right handling of a red-line file. A
first attempt at the edit rewrote the whole file's line endings
(3530 lines changed for one) and was reverted before committing;
the second preserves CRLF and the diff is one line - recorded
because a byte-wise gate elsewhere in the city would have caught
exactly that, and the sentinel's autocrlf lesson now has an
integrator instance. Its note that the coverage cap and the tangent
pin apply to any other bird being sited is appended to com-gap's
dispatch.

Slot margin closed by the user in the com-relay session (ed56496;
its reply dev/REPLY_comms_slots.md, bac2b71): accepted, the 8 deg
mask on record as the relief valve, slots stay - moving them again
would forfeit the 157.2E occultation hit that was the point of the
proposal. Premise carried with the ruling, written into the skeep
card's ruling row: the 0.55 deg is held up by slot 3's +/-0.25 deg
station-keeping box, not by geometry; slot 3 at 297.3E sits in the
drift maximum (32.3 m/s/yr), and a +/-0.5 deg box would take the
10 deg margin to zero. The card now prints the margin under both
masks as seam elevation (10 deg mask: 0.55 deg, seam elevation
10.29; 8 deg: 4.45), so the number shows what holds it up. Its
three reasons stand as its own: the seam is at 227.25E on the
equator with no assets; 10 deg is a design mask, not a physical
cliff, and the seam is on equatorial plain; the 8 deg relief needs
no hardware. Two things it handed forward, both now in com-gap's
dispatch: a pre-registered triage for the cross-check (R_a =
3396 + 25 km; instantaneous declination, Earth as a fixed RA point
source; expected residual about 1.8 km meridional at agreement),
and a request for the seam-phase result from the beat-long run,
since its own account is static geometry. The two QA screenshots
are tracked with bac2b71; it walked past the same line-ending trap
the same day (513/487 and 371/363 whole-file diffs, located by
looking at the first line's bytes), and proposes the sentinel
heuristic that both sides have now reproduced independently:
insertions about equal to deletions about equal to the file's line
count means check line endings first, not content. Adopted into
the integrator's memory.

Account 22 delivered (glass, dev/REPLY_glass_qL_prereg_review.md,
committed 56ba5ad by hunk and path; its book 274c238 / a290fa3 /
6039f54). The three-case protocol was registered at 08:43:09 and
the surface result first landed at 08:46:07 - three minutes, but in
the right order and timestamped. Caliber unchanged, queue not
stopped: ICRP 60 three-branch Q(L) applied step by step to every
charged secondary, no LET histogram; p / He-4 / Fe-56 at 10 MeV/n
to 200 GeV/n with projectile and target fragmentation; neutrons
counted through recoil tracks (proton cut 1 um), residual neutral
deposition 1e-5 of D, bracket width 1.000; dry regolith rho 1.60
from the material definition, moisture bin 0.00 by definition and
not read back from any thermal k; geometry the book's own cabin
model, crown-uniform cover with end caps buried and no windows, so
it maps only onto the village's crown / bunk class and not onto the
taper or the vestibule. 21 runs at src_sha 2a74fcfd, explicit
seeds, zero overlaps; 46 gates, 43 green, 3 declared failures.

Surface: D 0.197 mGy/day = 0.94x RAD (0.74x with protons only in
account 16, the He and Fe terms closing most of the gap); H_low
0.377 mSv/day = 137.6 mSv/yr = 0.59x RAD; <Q> 1.91 (scorers 1.82 /
1.89 / 2.06; per track p 1.79, He 1.92, Fe 12.5). Zone Z1 of the
registered table: in band, below the window missing ions should
have left. Two of six per-track checks fail - D_Fe/D 0.0095 against
0.04-0.20, and s_miss 0.41 against <= 0.40 - so by the table the
deep table ships UNAUDITED and the D-bin diagnostic ran (separate
binary cb79ee45, separate seeds): the two direct fingerprints of Q
misapplied are absent (light family 1.004 against 1.00 +/- 0.02;
closure 1.000; production/diagnostic 0.95), heavy-recoil families
at 13.0 and 8.1 are the right magnitude, but the hadron family's
<Q> 1.44 sits below a band of 1.5-2.5 the book set itself and
admits is not a known answer. Its reading of the two failures,
written after the numbers and marked so: D_Fe/D fails because its
expectation used free-space n Z^2 weights and forgot that 20 g/cm2
of atmosphere removes every Fe below about 800 MeV/n; and s_miss
0.41 next to Fe at 6% of H means the 41% shortfall to RAD is not
one missing ions can fill - Z = 3-25 would add 10-20% - the rest
is the model's <Q> sitting below RAD's, where Geant4/HZETRN-class
models give 2.2-2.7 against RAD's 3.05. It notes this is the other
face of the day's warning: it did not land on 3.05, and the amount
by which it missed exceeds what the declared omission explains.
The book cannot clear itself; the audit needs an external known
answer for the Mars-surface proton-family <Q>.

Dose equivalent under cover, three-scorer mean, lower bound H_low
and upper bound H_pin = H_low x (0.64 / H_s) with its one
assumption stated (pinning to RAD at the surface and carrying the
missing group down at the simulated mixture's attenuation
overstates it at depth, since the missing ions fragment faster
than protons):
  g/cm2   H_low   near/centre/far     range  <Q>   Fe%   H_pin   D
  160     38.0    41.4/39.2/33.5      21%    2.23  1.0   64.6   17.1
  240     39.0    39.5/42.3/35.2      18%    2.02  0.7   66.3   19.3
  320     30.1    29.9/26.9/33.5      22%    2.13  0.8   51.2   14.1
  400     27.2    29.1/22.2/30.1      29%    2.42  0.6   46.2   11.2
  480     24.6    26.9/21.7/25.1      21%    2.22  0.8   41.8   11.1
  640     23.1    23.3/24.8/21.3      15%    2.32  0.7   39.3   10.0
Hand-off (sigma:H_low): 160:38.0 240:39.0 320:30.1 400:27.2
480:24.6 640:23.1; surface 0:137.6 as a check point, not fitted.
Declared gate failure 3c: the Fe flux normalisation 1.0e-3 sits
above its 2-9e-4 band (the LIS shape borrowed from protons
overstates low-energy ions), but low-energy Fe does not reach the
surface through 20 g/cm2, Fe is 1.0% of surface D and 6% of H, and
the whole-table effect is about 3% (320: 30.1 -> 30.0 at the band
midpoint). What it can and cannot say, asymmetric as registered:
HZE does not dominate the equivalent under cover, Fe at most 1% in
every bin and at most 2% even at the 2x flux overstatement - a
sentence that uses only an upper bound and is not hurt by the
statistics; <Q> RISES with depth, 1.91 at the surface to 2.0-2.4
under cover, and the diagnostic attributes the rise to target
fragmentation and recoils, not HZE - its own pre-registration had
the opposite direction, deep <Q> falling as HZE fragments, and it
records that as wrong; it cannot give the central Fe share in any
deep bin, the Z = 3-25 contribution, or the attribution of the
41% surface gap; it does not judge shape (sci-rad-01's) or the
allocation (the integrator's). Expectation scorecard 4 of 13. Its
two pitfalls, on record in its README: src_sha.h must sit in the
CMake source directory - new code was built against the old header
and the binary self-reported account 21's hash, so a self-report
holds only when the self-reported thing is itself verified; and
gate 2b went red on CRLF/LF and is compared by line with bytes
untouched.

INTEGRATOR RULING on the weight of the 320 g/cm2 sentence under
unaudited status, which glass asked for and which is this ledger's
to give. The pre-registered shape reads: mean above 20 and every
scorer above 20 gives "lower bound above the allocation line, 2 m
insufficient on this caliber". At 320 the mean is 30.1 and the
scorers 29.9 / 26.9 / 33.5, all above. The unaudited flag arises
because <Q> came out LOW and two per-track checks failed low; the
direct fingerprints of Q applied too high are absent; and H_low is
a lower bound by construction independent of the diagnostic. So
the audit question bears on how far above 20 the true value is,
not on which side. Stress-tested in the one direction that could
lower it, since the day's own lesson is that a met expectation
(18-40 at 320 was met) is the case nobody audits: the He flux 0.265
sits above glass's own expectation 0.10-0.16 while inside its
band, and He carries 17-26% of H; at the expected He flux the 320
mean falls to about 27 and the centre scorer to about 24, still
above 20; the Fe term is at most 6% of H and cannot move the
result; the proton absorbed dose reproduces account 21 within its
band; the geometry idealisation (end caps buried, no vestibule)
runs the other way, since the village's taper and vestibule can
only add. Scatter: a three-point range of 22% is about 7.5% on the
mean, so 20 lies roughly four such units below 30.1 and three
below the stressed 27. Ruling: on the ICRP 60 Q(L) caliber with
p / He / Fe, dry regolith, crown-uniform cover, the in-cabin dose
equivalent under 2 m of cover has a lower bound of 30.1 mSv/yr
(scorers 26.9-33.5), above the 20 mSv/yr allocation by a margin
that survives every named uncertainty, and every unresolved item
- the missing Z = 3-25, the model's <Q> below RAD's, the village's
taper and vestibule - raises it. NOT ESTABLISHED that 2 m suffices;
ESTABLISHED as a lower bound that it does not, on this caliber.
The unaudited status bears on precision, not direction, and is
carried with the number. The upper bound 51.2 settles nothing on
the other side, as pre-registered.

Consequences dispatched. To sci-rad-01: the external known answer
glass cannot supply - a Mars-surface proton-family <Q> from RAD's
own LET spectrum, which is the only thing that can clear or
condemn the unaudited flag (dev/DISPATCH_scirad_proton_Q.md). To
the village: the review's inputs now exist, the ruling above is
its trigger, the mapping caveat (crown class only) is carried, and
the prohibition on inventing replacement parameters still holds
(dev/DISPATCH_village_shielding_review_start.md). Not dispatched:
the Z = 3-25 C/O runs (about 1.5 h) - they cannot move the
allocation decision, since the lower bound already clears the line
and the upper bound cannot reach it; they matter for the
redesign question of how much more cover, which is the village's
next step and the user's to open.

sci-thz-01 (25a7341, row 4fa780f): ruling 3 withdrawn - its
premise was void and it takes the fault as much as com-gap's - and
3.59 / 3.66 / 3.72 K (09-03) and 2.22 K (09-02) all retired into
the card's retirement vocabulary; the term becomes three rows each
naming its ground and its user: L, the locus (tile medians, d = 0
by construction, citable for the regional role), C, the city
(ramp d x 6.83 m/km, citable only on passes whose tangent nears
the city, never under the assumed slots), and X, displaced, which
is not a terrain question at all - a profile 2000 km away is a
measurement of somewhere else. The ramp is a bias of d x slope,
not slope x sigma; ruling 3 had the right formula with the wrong
d. At 2.5 K/km neither product trips 2x for the regional role
(orbiter 1.21 K, 1.10x; com-polar 1.23 K, 1.53x), so "the
footprint, not the instrument, sets the error" - the headline of
rulings 1 to 3 - is reversed for that role and undecided for the
city role, where the verdict is decided by the d of the meridian
passes (com-polar crosses 2x near d ~ 81 km, the orbiter not before
~100 km). Ruling 4 is pre-registered and held with row L carried
downstream under a terrain_hold flag; its one remaining input is
com-gap's pass-by-pass d under the design slots. On the lapse rate
it keeps the discipline: the capability is real but was shown on a
simulated truth of 1.400 K/km, so it is not yet a measurement of
Mars; 2.5 K/km stays with the 1.4-5.05 band stated until the
product's own value exists. Its direction statement: this
correction cuts against its own book twice, which is the direction
a correction should be trusted in.

Repositories: every dossier that was active without one now has
one - tokamak b555457 (356 files), mars-weather b6475b9 (134),
mars-swir 85c6b3e (134), mars-village 37a6779 (67) - all local, no
remote, .gitignore first, autocrlf off, static checks run; anchors
added to the conventions ledger rows. sci-swir-01 has no row in
that ledger and its retirement conventions remain undeclared; a
scan of that dossier is still not to be read as clean.

Village redesign opened by the user (2026-09-05). Two dispatches
filed, both pre-registration-first.

To glass (dev/DISPATCH_glass_village_redesign_runs.md), three runs
in order: A, the Z = 3-25 group by C and O at about 18k each, to
lift H_low to a direct estimate, with the expected lift per bin
written before running and the statement that C and O stand in for
the group and are not it; C, hydrogen in the cover - the 320 g/cm2
bin and one deeper bin at the city's moisture bins 0.03 / 0.08 /
0.15 by mass, direction and magnitude pre-registered because
hydrogen moderates neutrons and also makes recoil protons that
score with Q, so the sign at that depth is not obvious, and marked
as material scans, not claims about the village's regolith; B, the
village's own geometry - taper, end faces, vestibule with its
declared door - built from a file the village delivers and not
filled in by glass, with a vestibule scorer and the vestibule-to-
crown ratio pre-registered against the only analogue on record,
account 16's window well at 1.49x absorbed.

The reason C is on the list is the H_low column itself: 38.0 /
39.0 / 30.1 / 27.2 / 24.6 / 23.1 from 1 to 4 m. No scanned
thickness reaches 20 and 4 m is still 23.1 as a floor. That is
FLATTENING read as a designer: the floor is secondaries made inside
the cover, thicker cover adds their source with their shield, and
extrapolation past 4 m is unsupported and already declined by the
village. Thickness is not the lever; on this caliber it does not
get there, and the sentence is a floor.

To the village (dev/DISPATCH_village_redesign.md): four levers,
none to be estimated - hydrogen in the cover (its design side:
whether ice, hydrated minerals or a liner can go in at all, with
mass, source and thermal consequence, the thermal account rerun
rather than assumed harmless, and the reverse of its own
prohibition holding: a design moisture is not harmless to k any
more than k is a moisture measurement); geometry, delivered to
glass as dev/DELIVERY_village_geometry.md with the frozen path
table named by path and timestamp; interior arrangement, which it
holds entirely and glass's 63-to-40 gradient makes a zero-cost
variable; and the allocation, where the plaza budget's honest EVA
term is to be printed beside the 20 mSv/yr line as a declaration
of the constraint and not a way of moving it. Order: geometry file
first, since it gates Run B and nothing depends on the village
otherwise; then the review reply; then the redesign reply. The
prohibition gains a second clause: no lever is credited with a
dose reduction before its run lands.

Fusion asset: the user rules rebuild, not annotation (tokamak's
dev/REPLY_pwr-fusion-01_asset_rebuild.md, filed because its message
channel is gone too). Target geometry all sourced, nothing new:
cryostat outer r = 4.235 m from LAYER 8 of ch_step0.log, bioshield
outer r = 4.535 m as 4.235 plus the declared 0.30 m build
thickness with no gap, height 11.51 m as the full-wrap convention
upheld here on 2026-09-02, 7.02 m printed beside it as "vertical
construction undecided". The current asset is built at R 7.15 and
H 15 with three hard-written port radii and three auxiliary groups
placed relative to the cryostat; the card has eight dimension
fields. It asked one ruling first - whether to carve 11.51 into the
model before vertical construction is decided - and offered to do
the rebuild itself under mars-unit-flow. Ruled and dispatched
(dev/DISPATCH_pwr-fusion-01_asset_rebuild.md): build at 11.51 with
7.02 printed beside; the model matches the delivery it is drawn
from, not a decision not yet made, and the card's wording is what
keeps the convention from hardening; vertical construction stays
the tokamak's and the asset follows it as a second delivery. The
work is the tokamak session's, since it holds the provenance;
delivery by file, commit by path after validate, y-envelope,
triangle budget, smoke test, POI anchors and audit_layout; the
visible envelope is the bioshield with the ribs on the cryostat
inside it; position unchanged; main.js a red line; and no
layer-stack change is authorised - if the rebuild wants one, that
is a design change under its obligation e2661e2 and it stops and
raises it. The 2026-09-03 integrator note on the card goes when the
numbers it warned about go.

Glass's redesign runs, pre-registered before any physics result
(its b493f47, dev/REPLY_glass_village_redesign_runs.md). Run B
stopped, correctly: dev/DELIVERY_village_geometry.md does not
exist and the dispatch said to fill no gap; the only thing
registered is the expected vestibule-to-crown equivalent ratio,
1.3-1.8, against the one analogue on record, and the list of what
the file must contain (frozen path table by name and timestamp, a
3-D cover description or an equivalent areal-density field,
vestibule dimensions and door positions, scorer coordinates and
classes) - missing any one, it stops again and names it. Run A
(account 23): C-12 and O-16 from the same abundance table as
account 22's He and Fe; H_direct = H_low + H_C + H_O printed beside
H_low and still a lower bound, since N, Ne, Mg, Si and the rest of
Z = 3-25 weigh about 0.9-1.3 of C+O; expected lift, per bin and
before data, +4 to +10% at the surface and +2 to +8% under cover,
any bin above +15% flagged as a surprise; and a correction of its
own estimate quoted in the dispatch - "18k each, about 1.5 h" had
counted one bin as seven - replaced by the account-22 rule: the
smallest N giving the C+O track a relative statistical error of
25% or better at 320 g/cm2, machine time capped at 5 h, floor 3000
per bin per species, seeds written down. Run C (account 24):
material Regolith_w = (1-w) dry Rocknest + w H2O at w = 0.03 /
0.08 / 0.15 by mass with total density held at 1.60 so the [geom]
line is byte-identical and the bins stay comparable; 320 and 640
g/cm2; p 40k + He 18k on the same seeds as the dry runs, Fe carried
as a constant; the material self-reported by the binary on a [mat]
line into the evidence row, and a w = 0 run on the same seeds
required to reproduce account 22 byte for byte, proving the
material branch does not touch the dry path. Expected direction:
DOWN at both bins - hydrogen moderates the fast neutrons made in
the cover, so fewer reach the scorer and the recoil term (about
half of H in the account-22 diagnostic) falls, and the higher
stopping power of hydrogen lowers the proton term too; the
integrator's worry about hydrogen recoil protons is answered - they
deposit in the cover, not in the scorer, and do not enter H on
this caliber; a rise beyond twice the paired sigma is a surprise
and the [mat] line is checked first. Expected size: at 320, -1 to
-6% / -3 to -12% / -5 to -20% for the three w; at 640, -2 to -8% /
-5 to -16% / -8 to -25%. Resolvability declared before data: the
three-scorer mean carries about 5-8% statistical sigma, so w = 0.03
is expected unresolvable and gets numbers with sigma and no
direction; "a lever exists" is fixed as w = 0.15 showing a paired
mean difference of at least -2 sigma_pair at both bins with the
same sign, otherwise "not established at this statistics" - a test
that can establish the direction and cannot deny it, written in
that shape. Declared as material scans, not claims about the
village's regolith. Smoke runs for timing in progress; N and total
machine time to be recorded as a revision before the queue opens.
Nothing here needed a ruling; recorded and committed.

Intake of 2026-09-05 afternoon, all through the file channel.

com-gap under the design slots (dev/REPLY_comgap_slots_rerun.md,
its c62d6e1; card and reply 03f3922): UNKNOWN_OFFSET_KM is under
1 km - closest approach 0.96 km, converging 3.34 -> 1.56 -> 0.96 as
the time step halves, so a measurement of the delivered design
where the earlier 132-2248 km could not be; 753 passes per beat,
12 within 400 km (1.6%), revisit about 3.5 sols, meridian passes
sweeping 12.0-24.2 N through 18.4. Blind cross-check against
com-relay-01's hit: 1.82 km, inside the pre-registered 10 km, the
longitude pin agreeing to 0.03 deg (79.86 measured against 79.83
implied) so neither R_a nor the declination handling needed
opening. Then the finding that the cross-check was designed to
allow: the two ledgers compute different links - com-relay-01 the
areostationary sat's Earth link, occulted once a sol with tangent
latitude set by Earth's declination (its "172 sols a year" is that
link), com-gap the polar-areostationary crosslink with latitude
sweeping on the polar bird's argument of latitude. What they share
is the longitude pin, and latitude agreement had been
pre-registered as not a gate. Two occultation products therefore
exist at the city meridian, and anyone citing "the occultation"
must say which. Terrain delivered as the distribution thz asked
for, evaluated at each pass's lowest tangent point for the 54 of
753 passes inside the tile (the rest not evaluated, stated):
meridian passes, n = 10, total 898 / 1460 / 1718 m, roughness 451
/ 529 / 594 m, slope 7 m/km - 2.0 K total, 0.72 K roughness at the
measured lapse rate; loci passes, n = 44, 226 / 471 / 1837 m
total, 116 / 379 / 725 m roughness, slope 1 m/km - 0.64 / 0.52 K.
Its corrections to its own record, made before acceptance: the
earlier single-point city value 1438 / 552 sits inside the
meridian population and was right; "the occultations never sample
the city" was right only under the slots it had assumed; the "six
clustered events" were one pass's time samples; and three gates
were re-posed on its own statistics before the run was accepted -
a 1 km tolerance tighter than one time step, re-posed as step
convergence; a pin longitude read at the point nearest the city,
biased toward the city by construction, re-posed at each pass's
lowest tangent; and a stacked-axis bug in the seam coverage that
gave 0% at 45 N until the s02 regression caught it. The seam: the
areostationary sats are stationary in their own frame so their
seam does not open on the beat; what the polar ring adds is
coverage of 61-78% of that seam while it is open, which is
com-relay-01's decision to use. K columns held at 1.4 K/km with
the measured 1.360 +/- 0.088 and its effect (x0.971 +/- 0.063)
printed beside them rather than thirty numbers re-issued that each
move by less than their own error bar - the integrator's own
ruling, executed as ruled.

thz (85f895b) had already filed that ruling 4 was not made because
the re-run was absent when it looked, made the rule executable and
dry-ran it, and the dry run falsified half of its P2 - the 2x
crossing for com-polar comes at d ~ 17.8 km, not 81. Now the
distribution exists. Which row and which link it takes is its
call; nothing here chooses.

Village, two replies (dev/REPLY_village_shielding_review_start.md,
dev/REPLY_village_redesign.md, card 16/8 lines; bd43425; its own
71fe4e8). The dose basis moves from withdrawn to bounded from
below, the two states kept apart. Rebasing only where the geometry
corresponds: glass's crown-uniform, end-buried, windowless model
maps onto the bunk class alone (crown measured 1.97-2.08 m, 325-
343 g/cm2 at its 1.65); the living taper, the vestibule and a rear
end cap of 1.78 m at z = -4 (294 g/cm2, thinner than the 320 bin,
never separately listed before, 1.7 m from the bunks) are declared
gaps for Run B and not interpolated; the 0.5 m bin has no glass
counterpart and is left a gap. The plaza card's in-cabin term has
no number, only a floor: at 30.1 mSv per Earth year the zero-EVA
Mars year is 30.1 x 1.881 = 56.6 mSv, already over 50, and one
hour of EVA per sol adds about 17.9 per Earth year on the RAD-
measured basis, so "a Mars year can be held under 50" is
withdrawn; "the other half is rostering EVA" survives. Two lines
printed and neither moved: the city's 20 mSv/yr in-cabin
allocation, missed by at least 1.5x, and the card's own 50 per
Mars year total, which is 26.6 per Earth year all-in and can
absorb at most 26.6 in-cabin at zero EVA, 18.0 at half an hour per
sol, 9.1 at one hour - the stricter line, crossed by the same
floor. Transitional housing becomes a necessity rather than a
convenience: stay limit = personal allocation / (>= 30.1 + EVA
term), an inequality until Run B. Redesign, design side only and
not one dose number: hydrogen in the cover has three routes -
ice-soil fill from res-rodwell-01 with a sublimation-migration
problem stated (295 K shell, 215 K deep soil, ice near the shell
migrates outward and the hydrogen leaves the shell side) and a
thermal parameter sweep in place of a chosen k, since ice-cemented
regolith's k is not in its book; structural-water minerals from
res-mine-01 pending assay, mass of the same order as ordinary fill
and water stable to about 400 K; a 0.10 m polyethylene liner at
about 101 t over about 1,065 m2 of shell. Whole-village cover is
about 11.8 kt. Geometry: three measured gaps handed to glass; no
geometry moves before Run B, and the order is Run B first, then
solve geometry from the result - "place first, measure later" was
last round's lesson. Interior: bunks all at z = -2.3, the deepest
end; a candidate living position at z = -1.0 under the 2.08 m
crown is declared as an added scorer pair for Run B, the ratio
being the lever's value and not estimated; the occupancy weighting
is a separately versioned declaration owed before any over-limit
ruling. Prohibition held, both clauses. Its CHECKLIST summary had
been appended to the glass row by mistake and was relocated by the
integrator with the text unchanged (2be430d).

Imperial city R7, Astra's round, delivered as a package
(dev/DELIVERY/_imperial/_r7.md with manifest, dedicated validator,
smoke page, screenshots; module and card committed 53bf29d after
SHA-256 of module, card and the untouched main.js matched the
manifest, syntax checked, five cards with five matching poi_
anchors). Its validator counts every procedural instance:
169,640 of 170,000 triangles on the real terrain with 360 spare
(and it says so - a different standing position changes the step
count and the number does not transfer); envelope 28.7-228.5 m,
1181 x 200 x 953 m, the 953 m depth exceeding the early ~800 m
design envelope and reported as measured rather than replaced;
7,785 ray checks along the 778 m axis with zero breaks; smoke on
the real main city at 113 of 120 draws, error listeners zero, one
MutationObserver TypeError of no traceable origin recorded rather
than dropped. Its scope statement is the right shape: the
repo-wide validate_units.mjs exits 1 on five other assets' minY
(sci-radio-01 -2.80, sci-cray-01 -2.20, sci-astro-01 -2.21,
com-l4-01 -1.88, sci-orbiter-01 -5.00), none touched and none
hidden - a city item now, whether those are real or the ground
rule misapplied to orbital assets. Two things it could not do
because they are main.js and main.js is the integrator's:
collectColliders() skips InstancedMesh, and the imperial way's
steps and paving are instanced, so first-person collision fails on
all 157 path points; and loadImperial() does not read the layer's
card while loadPois() reads only the units directory, so the five
cards are delivered but not shown. Both open here, next.

Runs A and C landed (glass, sections 4-5 of its runs reply; 275f64e;
its book 19f9d22 / d2855c0 / 91f0acb; main checks 218 gates, 211
green, the seven declared failures all in accounts 8 / 16 / 22,
none in 23 / 24).

Run A, account 23 (C-12 and O-16 added, 14 runs at src_sha
477dd1cc, 15 of 15 gates): H_direct beside H_low - surface 143.8
(137.6), 160:39.8 (38.0), 240:40.3 (39.0), 320:31.0 (30.1),
400:28.0 (27.2), 480:25.6 (24.6), 640:24.1 (23.1); lift +2.8 to
+4.5% under cover and +4.5% at the surface, every bin inside the
pre-registered +2 to +8%, scorecard 10 of 11 (only <Q>_O came in
low); C+O statistical error at 320 about 8% against the 25% target.
Still a lower bound: N, Ne, Mg, Si and the rest weigh 0.9-1.3 of
C+O by n Z^2 and by this run's measured shares add another +3 to
+5%. The sentence it can say: the whole Z >= 2 group (He, C, O, Fe)
is 20-30% of the equivalent under cover, almost all of it helium,
and Z >= 3 together is at most 5% - the redesign's object is the
secondaries made in the cover, not the heavy ions.

Run C, account 24 (12 runs plus one w = 0 reproduction on the same
seeds, 11 of 11 gates, gate C4 the byte-identical reproduction of
account 22 at w = 0 proving the material branch leaves the dry
path alone; [mat] line self-reported into the evidence row). p + He
with Fe carried as a constant, paired differences on shared seeds
as the primary statistic with sigma_pair from three paired
differences (3 dof, order of magnitude) and sigma_indep printed
beside it. Table, H in mSv/yr and the paired z:
  320  w 0.00  29.9        -
  320  w 0.03  29.9  +0.0%  z_pair +0.00 (declared unresolvable in advance)
  320  w 0.08  25.8  -13.5%  z_pair -1.46
  320  w 0.15  22.5  -24.6%  z_pair -5.14 (z_indep -2.2)
  640  w 0.00  23.0        -
  640  w 0.03  19.3  -16.2%  z_pair -2.20
  640  w 0.08  16.5  -28.0%  z_pair -3.98
  640  w 0.15  17.4  -24.0%  z_pair -2.65
By the criterion fixed before data - w = 0.15 at both bins with a
paired mean difference at or below -2 sigma_pair and the same sign
- hydrogen IS a lever on the material basis (z -5.14 and -2.65;
also on the more conservative sigma_indep). Direction as
pre-registered, down at both bins, all five resolvable cells down,
the one +0.0% being the cell declared unresolvable. Magnitude:
glass's scorecard is 1 of 6 - it estimated its own effect small,
and w = 0.08 and 0.15 fall outside the strong side of its expected
ranges at both bins. Not established: whether 0.08 to 0.15
saturates (640 goes -28.0 to -24.0, non-monotonic inside a
sigma_pair of 7-9%); w = 0.03 at 320 is unresolvable as declared.
What it does to the line, shape only and by glass: at 320 g/cm2
with w = 0.15 the p + He value 22.5 plus about 4% for Fe / C / O is
about 23.4, still a floor and still above 20; at 640 g/cm2 the 17.4
(about 18.1) is a floor BELOW 20 - the first configuration in the
whole scan where "enough" is not excluded. A floor below the line
settles nothing by itself; it means the question is no longer
settled against. Declared as before: material scans, not a claim
about the village's regolith, whose moisture stays undetermined and
must not be read from its thermal k; whether hydrogen can be put in
the cover (ice, hydrated mineral, polymer liner) is the village's
and the mine's design question.

Integrator: both dispatch files carry an addendum. Glass's section 6
still says Run B waits on the geometry file, which has existed
since cee837a; it is told to check the file against its own
section-0 list and stop on the first missing item. The village is
pointed at the Run C table, told what it does and does not settle,
and reminded that no dose credit attaches to the lever until Run B
reports the same lever in the village's own geometry.

Release readiness, checked. README references 34 images; 32 are
tracked in the work repository and the two comic images under
idea/ are not - by design, idea/ lives only in the release clone
(the flow empties that clone but keeps .git, extras and idea), so
the archive overlay must not delete it. No E:\Claude path in any
card, the imperial card, or a docs page. The imperial layer is
walkable, its cards show, and its animations run on its own toggle
(647fa09). The fusion asset is still built at the old envelope with
the card saying so. The Celestial Palace's own ledger row does not
exist in CHECKLIST; its delivery lives in dev/DELIVERY/_imperial.
