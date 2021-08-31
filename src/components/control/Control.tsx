import "./Control.css"

const Control = ({
  label,
  tooltip,
  value,
  min,
  max,
  step,
  setValue,
  showFn,
  unit
}: {
  label: string,
  tooltip?: string,
  value: number,
  min: number,
  max: number,
  step?: number,
  setValue: (v: number) => void,
  showFn?: (v: number) => string,
  unit?: string
}) => {
  step = step || 1
  const handleInputChange = (val: string) => {
    const numberVal = parseFloat(val)
    if (val && numberVal >= min && numberVal <= max) {
      setValue(numberVal)
    }
  }
  return (
    // <div className="control-el tooltip">
      <div className="control-el tooltip control" style={{ width: '100%' }}>
        <div className="label">{label}</div>
        {tooltip ? <span className='tooltiptext'>{tooltip}</span> : null}

        <div className="slider">
          <input
            type="range"
            value={value}
            step={step}
            min={min}
            max={max}
            className="slider-pic"
            onChange={(e) => setValue(parseFloat(e.target.value))}
          />
          {showFn ? <output>{showFn(value)}{unit}</output> : <>
            <input
              className="input"
              min={min}
              max={max}
              value={value}
              type="number"
              onChange={(e) => handleInputChange(e.target.value)}
            />{unit}</>
          }
        </div>
      </div>
    // </div>
  )
}

export default Control
