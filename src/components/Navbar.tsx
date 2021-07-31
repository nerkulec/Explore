import React, { ReactElement } from 'react'
import './Navbar.css'

export default function Navbar({}): ReactElement {
  return (
    <div className='navbar'>
      <div className='navbar-column'>
        <span>Environment</span>
        <div className='navbar-box'>
          <select>
            <option selected>Cheetah</option>
            <option>Ant</option>
            <option>Cat</option>
            <option>Elephant</option>
          </select>
          <input type='range' min='0' max='100'></input>
          <input type='range' min='0' max='100'></input>
        </div>
      </div>
      <div className='navbar-column'>
        <span>Environment</span>
        <div className='navbar-box'>
          <select>
            <option selected>Cheetah</option>
            <option>Ant</option>
            <option>Cat</option>
            <option>Elephant</option>
          </select>
          <input type='range' min='0' max='100'></input>
          <input type='range' min='0' max='100'></input>
        </div>
      </div>
      <div className='navbar-column'>
        <span>Environment</span>
        <div className='navbar-box'>
          <select>
            <option selected>Cheetah</option>
            <option>Ant</option>
            <option>Cat</option>
            <option>Elephant</option>
          </select>
          <input type='range' min='0' max='100'></input>
          <input type='range' min='0' max='100'></input>
          <label>animate</label>
          <input type='checkbox'/>
          <label>animate</label>
          <input type='checkbox'/>
          <label>animate</label>
          <input type='checkbox'/>
          <label>animate</label>
          <input type='checkbox'/>
          <label>animate</label>
          <input type='checkbox'/>
          <label>animate</label>
          <input type='checkbox'/>
          <label>animate</label>
          <input type='checkbox'/>
          <input type='checkbox'/>
          <input type='checkbox'/>
          <input type='checkbox'/>
          <input type='checkbox'/>
        </div>
      </div>
    </div>
  )
}
