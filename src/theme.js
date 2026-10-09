const garageThemeMedia=matchMedia('(prefers-color-scheme: dark)');
function savedGarageTheme(){try{return localStorage.getItem('garage-theme')}catch{return null}}
function applyGarageTheme(value){
  const dark=value==='dark'||value!=='light'&&garageThemeMedia.matches;
  document.documentElement.dataset.theme=dark?'dark':'light';
  const button=document.querySelector('#theme-toggle');
  if(button){button.setAttribute('aria-checked',String(dark));button.title=dark?'Passa alla modalita giorno':'Passa alla modalita notte';button.innerHTML=lucide.createElement(dark?lucide.icons.Sun:lucide.icons.Moon,{'aria-hidden':'true'}).outerHTML;}
}
applyGarageTheme(savedGarageTheme());
garageThemeMedia.addEventListener('change',()=>applyGarageTheme(savedGarageTheme()));
window.addEventListener('storage',e=>{if(e.key==='garage-theme')applyGarageTheme(savedGarageTheme())});
document.addEventListener('DOMContentLoaded',()=>{
  const header=document.querySelector('header'),controls=document.createElement('div');controls.className='header-controls';
  const badge=header.querySelector('.preview');if(badge)controls.append(badge);
  const button=document.createElement('button');button.id='theme-toggle';button.className='icon-button';button.setAttribute('role','switch');button.setAttribute('aria-label','Modalita notte');
  button.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('garage-theme',next)}catch{}applyGarageTheme(next)};
  controls.append(button);header.append(controls);applyGarageTheme(savedGarageTheme());
});
