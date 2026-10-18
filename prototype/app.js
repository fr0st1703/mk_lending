(() => {
  const $ = s => document.querySelector(s);
  const menu=$('#mobile-menu'),menuButton=$('.menu-toggle');
  menuButton.addEventListener('click',()=>{menu.showModal();menuButton.setAttribute('aria-expanded','true');});
  $('.close-menu').addEventListener('click',()=>menu.close());
  menu.addEventListener('close',()=>{menuButton.setAttribute('aria-expanded','false');menuButton.focus();});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
  document.querySelectorAll('.faq-item button').forEach(button=>button.addEventListener('click',()=>{
    const expanded=button.getAttribute('aria-expanded')==='true';
    document.querySelectorAll('.faq-item button').forEach(other=>{
      const open=other===button&&!expanded;
      other.setAttribute('aria-expanded',String(open));other.querySelector('span').textContent=open?'−':'+';
      document.getElementById(other.getAttribute('aria-controls')).hidden=!open;
    });
  }));
  document.querySelectorAll('.policy-link').forEach(b=>b.addEventListener('click',()=>$('#policy').showModal()));
  $('#close-policy').addEventListener('click',()=>$('#policy').close());
  const form=$('#lead-form');
  const fields=[['full_name','name-error','Укажите ФИО, от 2 до 120 символов.',v=>v.trim().length>=2&&v.trim().length<=120],['phone','phone-error','Введите номер с кодом страны.',v=>/^\+[1-9]\d{6,14}$/.test(v.replace(/[\s().-]/g,''))],['message','message-error','Опишите задачу, от 10 до 2000 символов.',v=>v.trim().length>=10&&v.trim().length<=2000],['privacy_consent','consent-error','Подтвердите согласие.',(_,el)=>el.checked]];
  let submitted=false,busy=false;
  function validate(entry){const [id,error,message,test]=entry,el=$('#'+id),valid=test(el.value,el);el.setAttribute('aria-invalid',String(!valid));$('#'+error).textContent=valid?'':message;return valid;}
  fields.forEach(entry=>$('#'+entry[0]).addEventListener('input',()=>{if(submitted)validate(entry);}));
  form.addEventListener('submit',event=>{
    event.preventDefault();if(busy)return;submitted=true;
    const invalid=fields.filter(entry=>!validate(entry));
    if(invalid.length){$('#'+invalid[0][0]).focus();return;}
    busy=true;form.setAttribute('aria-busy','true');$('.submit').disabled=true;$('.submit').textContent='Отправляем…';$('#form-status').textContent='';
    setTimeout(()=>{
      busy=false;form.setAttribute('aria-busy','false');$('.submit').disabled=false;$('.submit').textContent='Отправить заявку';
      if($('#form-result').value==='error'){$('#form-status').textContent='Демонстрация сбоя: не удалось отправить заявку. Данные сохранены в форме. Попробуйте ещё раз.';$('#form-status').focus();}
      else{form.hidden=true;$('#demo-success').hidden=false;$('#demo-success').setAttribute('role','status');$('#demo-success').focus();}
    },1100);
  });
  $('#form-again').addEventListener('click',()=>{form.hidden=false;$('#demo-success').hidden=true;$('#full_name').focus();});
  const motion=window.landingMotion;
  if(motion){
    function showState(state){$('#preset-label').textContent=state.key+' · '+state.config.name;$('#radius').value=state.config.radius;$('#radius-value').textContent=state.config.radius+' px';$('#force').value=state.config.force;$('#force-value').textContent=state.config.force+' px';$('#pause').setAttribute('aria-pressed',String(state.paused));$('#pause').setAttribute('aria-label',state.paused?'Продолжить движение фона':'Приостановить фон');$('#pause').textContent=state.paused?'▷':'Ⅱ';$('#motion-state').textContent=(state.reduced?'Уменьшение движения: статичный фон.':state.paused?'Движение приостановлено.':state.precise?'Фон движется · курсор отталкивает узлы.':'Фон движется · сенсорный режим без отталкивания.')+' Цикл '+state.config.cycle+' с · дрейф '+state.config.drift+' px · возврат ≈ '+(state.config.recovery*3).toFixed(1)+' с.';}
    addEventListener('motionchange',e=>showState(e.detail));showState(motion.state);
    function cycle(direction){const keys=Object.keys(motion.presets),next=keys[(keys.indexOf(motion.state.key)+direction+keys.length)%keys.length];motion.setPreset(next);const url=new URL(location.href);url.searchParams.set('variant',next);history.replaceState(null,'',url);}
    $('#previous').addEventListener('click',()=>cycle(-1));$('#next').addEventListener('click',()=>cycle(1));
    document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button,[contenteditable=true]')||document.querySelector('dialog[open]')||$('.prototype-tools').hidden)return;if(e.key==='ArrowLeft'){e.preventDefault();cycle(-1);}if(e.key==='ArrowRight'){e.preventDefault();cycle(1);}});
    for(const name of ['radius','force'])$('#'+name).addEventListener('input',e=>motion.tune(name,Number(e.target.value)));
    $('#pause').addEventListener('click',()=>motion.pause());
    addEventListener('popstate',()=>motion.setPreset(new URLSearchParams(location.search).get('variant')||'B'));
  }else{$('#motion-state').textContent='Canvas недоступен — используется статичный фон.';}
  $('#settings-toggle').addEventListener('click',()=>{const panel=$('#motion-settings');panel.hidden=!panel.hidden;$('#settings-toggle').setAttribute('aria-expanded',String(!panel.hidden));});
  $('#hide-tools').addEventListener('click',()=>{$('.prototype-tools').hidden=true;$('#show-tools').hidden=false;$('#show-tools').focus();});
  $('#show-tools').addEventListener('click',()=>{$('.prototype-tools').hidden=false;$('#show-tools').hidden=true;$('#settings-toggle').focus();});
  if(new URLSearchParams(location.search).get('clean')==='1'){$('.prototype-tools').hidden=true;$('#show-tools').hidden=false;}
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.reveal').forEach((el,i)=>{el.classList.add('pending');el.style.transitionDelay=(i%4)*80+'ms';observer.observe(el);});}
})();
