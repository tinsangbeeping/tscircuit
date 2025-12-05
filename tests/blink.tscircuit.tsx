export const Circuit = () => (
  <board width={10} height={10}>
    <battery
      name="VCC1"
      voltage="5V"
      pcbX="1mm"
      pcbY="1mm"
    />
    <resistor
      name="R1"
      resistance="220ohm"
      pcbX="4mm"
      pcbY="1mm"
      footprint="0805"
    />
    <led
      name="D1"
      pcbX="6mm"
      pcbY="1mm"
      footprint="0805"
    />
    <trace path={[".VCC1 > .pos", ".R1 > .left"]} />
    <trace path={[".R1 > .right", ".D1 > .anode"]} />
    <trace path={[".D1 > .cathode"]} />
  </board>
)
