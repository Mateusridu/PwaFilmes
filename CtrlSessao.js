"use strict";

import CtrlManterAlunos from "/CtrlManterAlunos.js";

export default class CtrlSessao {
  
  //-----------------------------------------------------------------------------------------//
  
  constructor() {
    this.ctrlAtual = new CtrlManterAlunos();
  }
  
  //-----------------------------------------------------------------------------------------//
}

var sessao = new CtrlSessao();

//------------------------------------------------------------------------//

//
// O código abaixo está relacionado com o deploy do Service Worker. Isso permite que nossa 
// aplicação se torne um App para Dispositivos Mobile
//
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js', {scope: '/'})
  .then(function(reg) {
    // registration worked
    console.log('Registro do Service Worker bem sucedido. O escopo de uso é ' + reg.scope);
  }).catch(function(error) {
    // registration failed
    console.log('Registro do Service Worker com ' + error);
  });
}


//------------------------------------------------------------------------//
