import React, {useRef} from 'react';

/**
 * Render a reliable, vertically centered date label while keeping a real native
 * date/month input across iOS Safari, Android and desktop browsers.
 * iOS localizes its internal <input type=date> content (and can overflow it),
 * so the transparent native input receives interactions but does not paint text.
 */
export default function NativeDatePicker({mode='day',value='',onChange,required=false,className='',disabled=false,...props}){
  const ref=useRef(null);
  const isMonth=mode==='month';
  const text=typeof value==='string'&&value
    ? (isMonth ? value.slice(0,7).replace('-', '/') : value.slice(0,10).replaceAll('-', '/'))
    : (isMonth ? '選擇月份' : '選擇日期');
  return <div className={`native-date-control ${className}`.trim()} data-mode={isMonth?'month':'date'}>
    <span className={`native-date-display${value?'':' is-placeholder'}`} aria-hidden="true">{text}</span>
    <input {...props} ref={ref} type={isMonth?'month':'date'}
      className="native-date-input" required={required} disabled={disabled} value={value||''}
      onChange={onChange} onClick={()=>{try{ref.current?.showPicker?.()}catch{/* Native iOS date picker opens on touch. */}}}/>
  </div>;
}
