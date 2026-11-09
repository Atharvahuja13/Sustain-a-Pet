import PetRig from './PetRig.jsx'
import Burst from './Burst.jsx'
import Leafling from './Leafling.jsx'
import Mossy from './Mossy.jsx'
import Sunbud from './Sunbud.jsx'

const BODIES = { leafling: Leafling, mossy: Mossy, sunbud: Sunbud }

/** One pet (no canvas): the sprite model, shared motion rig and reward bursts. */
export default function PetModel({ sprite = 'leafling', stage = 0, mood = 'Thriving', fx = {}, reduced = false, position, scale }) {
  const Body = BODIES[sprite] ?? Leafling
  return (
    <group position={position}>
      <PetRig stage={stage} mood={mood} fx={fx} reduced={reduced} scale={scale}>
        {(ctl) => <Body ctl={ctl} stage={stage} mood={mood} reduced={reduced} />}
      </PetRig>
      <Burst kind="leaves" burstKey={fx.leaves} reduced={reduced} origin={[0, 1.4, 0.4]} />
      <Burst kind="confetti" burstKey={fx.confetti} reduced={reduced} origin={[0, 1.2, 0.5]} />
      <Burst kind="sparkle" burstKey={fx.sparkle} reduced={reduced} origin={[0, 1.4, 0.4]} />
    </group>
  )
}
