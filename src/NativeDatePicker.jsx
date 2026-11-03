import React, {useRef} from 'react';

/** Native iOS / Android / desktop date control. Keeps existing input-like onChange contract. */
export default function NativeDatePicker({mode='day',value='',onChange,required=false,className='',...props}){
  const ref=useRef(null);
  return <input {...props} ref={ref} type={mode==='month'?'month':'date'}
    className={`native-date-input ${className}`.trim()} required={required} value={value||''}
    onChange={onChange} onClick={()=>{try{ref.current?.showPicker?.()}catch{/* iOS opens native picker on tap */}}}/>;
}
