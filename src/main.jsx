console.info('[NEXPEN] v44 sell-picker / stock diary / compact summary loaded');
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(error){ return {error}; }
  componentDidCatch(error,info){ console.error('NEXPEN runtime error:',error,info); }
  render(){ if(this.state.error){ return <div style={{fontFamily:'-apple-system,system-ui',padding:24,color:'#172a38',background:'#f3f5f9',minHeight:'100vh'}}><h2>NEXPEN 啟動失敗</h2><p>請將下方錯誤訊息回傳以便修正：</p><pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',padding:16,background:'#fff',borderRadius:12,border:'1px solid #ddd'}}>{String(this.state.error?.stack||this.state.error?.message||this.state.error)}</pre><button onClick={()=>window.location.reload()} style={{padding:'11px 16px',border:'0',background:'#3577b8',color:'#fff',borderRadius:8}}>重新載入</button></div>; }return this.props.children; }
}
ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>);
