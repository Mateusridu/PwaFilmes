"use strict";

// A cláusula 'import' é utilizada sempre que uma classe precisar conhecer a estrutura
// de outra classe. No arquivo referenciado após o 'from' é necessário informar o que
// para a ser visível para a classe que utiliza o import. Para isso, lá colocamos a 
// indicação 'export'

// Importamos a definição da classe Aluno
import Aluno from "/Aluno.js";
// Importamos a definição da classe ModelError
import ModelError from "/ModelError.js";

/*
 * DAO --> Data Access Object
 * A responsabilidade de um DAO é fazer uma ponte entre o programa e o 
 * recurso de persistência dos dados (ex. SGDB)
 */

export default class DaoAluno {
  
  //-----------------------------------------------------------------------------------------//

  // único atributo presente em DaoAluno. Observe que é um atributo estático; ou seja,
  // se tivermos mais de um objeto DaoAluno, todos vão compartilhar o mesmo atributo
  // conexão.
  static promessaConexao = null;

  // Construtor: vai tentar estabelecer uma conexão com o IndexedDB
  constructor() {
    this.obterConexao();
  }

  //-----------------------------------------------------------------------------------------//
  
  /*
   *  Devolve uma Promise com a referência para o BD. Sempre que 'obterConexao' for chamado, 
   *  será necessário usar o await para recuperar o IDBDatabase.
   */ 
  async obterConexao() {
    // Como 'promessaConexao' é um atributo estático, usamos o nome da classe 
    // para acessá-lo
    if(DaoAluno.promessaConexao == null) {
      DaoAluno.promessaConexao = new Promise(function(resolve, reject) {
        // Faço uma requisição para abertura do banco 'AlunoDB'
        let requestDB = window.indexedDB.open("AlunoDB", 1); 

        //------------------------------------------------------------------------------------//
        // Defino abaixo o que requestDB irá executar se o  banco 'AlunoDB' não existir
        requestDB.onupgradeneeded = function criarBanco(evento) {
          let db = evento.target.result;
          // Solicito a criação da store 'AlunoST' no banco
          let store = db.createObjectStore("AlunoST", {autoIncrement: true});
          // Solicito a criação de um índica baseado no atributo 'matr' de Aluno
          store.createIndex("idxMatricula", "matricula", { unique: true });
        };

        //------------------------------------------------------------------------------------//
        // Defino abaixo o que requestDB irá executar se o  banco 'AlunoDB' não existir
        // Nesse caso, a promessa irá executar o 'reject'
        requestDB.onerror = function erro(evento) {
          reject(new ModelError("Erro: " + evento.target.errorCode));
        };

        //------------------------------------------------------------------------------------//
        // Defino abaixo o que requestDB irá executar se conseguirmos abrir o  banco 'AlunoDB' 
        // Nesse caso, a promessa irá executar o 'resolve'
        requestDB.onsuccess = function bancoAberto(evento) {
          if (evento.target.result) {
            // evento.target.result apontará para IDBDatabase aberto
            resolve(evento.target.result);
          }
          else 
            reject(new ModelError("Erro: " + evento.target.errorCode));
        };
      });
    }
    return DaoAluno.promessaConexao;
  }
  
  //-----------------------------------------------------------------------------------------//
  // Esse método devolve um objeto Aluno a partir do atributo 'matr', pois esse é usado 
  // como chave na indexação. Esse é um exemplo de método de consulta pela chave. 
  async obterAlunoPelaMatricula(matr) {
    let connection = await this.obterConexao();   
    // Crio abaixo um objeto Promise, pois não sabemos quando o banco será capaz de devolver 
    // o objeto aluno. Assim, lá no final deste método, temos o await vinculado com essa Promise
    // e é isto que nos garante que teremos um aluno ao final da execução desse métodos
    
    //---- PROMISE ------------------------------------//
    let promessa = new Promise(function(resolve, reject) {
      let transacao;
      let store;
      let indice;
      try {
        // Abre uma transação readonly no banco associado ao store 'AlunoST'
        transacao = connection.transaction(["AlunoST"], "readonly");
        // Recupero uma referência para o store 'AlunoST'
        store = transacao.objectStore("AlunoST");
        // Recupero uma referência para o índice 'idxMatricula' que mantém os objetos Aluno ordenados pela
        // matrícula
        indice = store.index('idxMatricula');
      } 
      catch (e) {
        // Se ocorrer algum erro, a Promise executará o 'reject'
        reject(new ModelError("Erro: " + e));
      }

      // Solicito a recuperação do objeto aluno usando o método 'get' associado ao índice.
      let consulta = indice.get(matr);
      // Defino a Callback vinculada com o retorno da consulta com sucesso
      consulta.onsuccess = function(evento) { 
        if(consulta.result != null) {
          // Retorno o objeto Aluno caso o resultado da consulta seja diferente de null
          let aluno = consulta.result;
          resolve(new Aluno(aluno.matricula, aluno.cpf, aluno.nome, aluno.email, aluno.telefone)); 
        }        
        else
          // Retorno null se não houver Aluno com a matrícula passada.
          resolve(null);
      };
      // Defino a Callback vinculada com o retorno da consulta com erro
      consulta.onerror = function(evento) { reject(null); };
    });
    //---- FIM PROMISE ------------------------------------//
    
    return promessa;
  }

  //-----------------------------------------------------------------------------------------//
  // Esse método devolve todos os objeto Aluno ordenados pela 'matr', 
  // pois será utilizado o índice. 

  async obterAlunos() {
    let connection = await this.obterConexao();      
    
    //---- PROMISE ------------------------------------//
    let promessa = new Promise(function(resolve, reject) {
      let transacao;
      let store;
      let indice;
      try {
        transacao = connection.transaction(["AlunoST"], "readonly");
        store = transacao.objectStore("AlunoST");
        indice = store.index('idxMatricula');
      } 
      catch (e) {
        reject(new ModelError("Erro: " + e));
      }
      // Para recuperarmos todos os objetos Aluno, precisamos abrir um 'Cursor' que pega
      // cada um dos objetos e os coloca na variável 'array' declarada abaixo.
      let array = [];
      indice.openCursor().onsuccess = function(event) {
        // recupero o cursor 
        var cursor = event.target.result;
        // Se o cursor for diferente null, então ele recuperou um objeto Aluno 
        if (cursor) {  
          const aluno = cursor.value;
          // incluo o objAluno no array
          array.push(new Aluno(aluno.matricula, aluno.cpf, aluno.nome, aluno.email, aluno.telefone));
          // peço ao cursor para recuperar o próximo Aluno 
          cursor.continue();
        } else {
          // O cursor chegou ao final, logo a Promise irá executar o 'resolve' retornando 
          // os objetos Aluno recuperados.
          resolve(array);
        }
      };
    });
    //---- FIM PROMISE ------------------------------------//

    return await promessa;
  }

  //-----------------------------------------------------------------------------------------//
  // Esse método devolve todos os objeto Aluno SEM utilizar o índice. Logo a ordem será 
  // estabelecida por quando o objeto Aluno foi inserido 

  async obterAlunosPeloAutoIncrement() {
    let connection = await this.obterConexao();      
    let promessa = new Promise(function(resolve, reject) {
      let transacao;
      let store;
      try {
        transacao = connection.transaction(["AlunoST"], "readonly");
        store = transacao.objectStore("AlunoST");
      } 
      catch (e) {
        reject(new ModelError("Erro: " + e));
      }
      let array = [];
      // Observe que, nesse caso, o cursor será aberto sobre o store e não sobre o índice
      store.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {        
          const aluno = cursor.value;
          array.push(new Aluno(aluno.matricula, aluno.cpf, aluno.nome, aluno.email, aluno.telefone));
          cursor.continue();
        } else {
          resolve(array);
        }
      };
    });
    return promessa;
  }

  //-----------------------------------------------------------------------------------------//

  async incluir(aluno) {
    let connection = await this.obterConexao();    
    //--------- PROMISE --------------//
    let resultado = new Promise( (resolve, reject) => {
      // Abrindo uma transação READ-WRITE
      let transacao = connection.transaction(["AlunoST"], "readwrite");
      transacao.onerror = event => {
        reject(new ModelError("Não foi possível incluir o aluno: " + event.target.error));
      };
      let store = transacao.objectStore("AlunoST");
      let requisicao = store.add(aluno);
      requisicao.onsuccess = function(event) {
        resolve(true);              
      };
    });
    //--------- FIM PROMISE --------------//
    return resultado;
  }

  //-----------------------------------------------------------------------------------------//

  async alterar(aluno) {
    let connection = await this.obterConexao();   
    //--------- PROMISE --------------//
    let resultado = new Promise(function(resolve, reject) {
      let transacao = connection.transaction(["AlunoST"], "readwrite");
      transacao.onerror = event => {
        reject(new ModelError("Não foi possível alterar o aluno " + event.target.error));
      };
      let store = transacao.objectStore("AlunoST");     
      let indice = store.index('idxMatricula');
      // Monto uma chave de procura para o cursor
      let keyValue = IDBKeyRange.only(aluno.getMatricula());
      indice.openCursor(keyValue).onsuccess = function(evento) {
        const cursor = evento.target.result;
        if (cursor) {
          // Se estiver de fato com o objeto Aluno armazenado com a matrícula passada
          if (cursor.value.matricula == aluno.getMatricula()) {
            // Atualizo o objeto Aluno no banco fazendo a solicitação ao Cursor.
            const request = cursor.update(aluno);
            request.onsuccess = function () {
              resolve(true);
            };
          } 
        } else {
          reject(new ModelError("Aluno com a matrícula " + aluno.getMatricula() + " não encontrado!",""));
        }
      };
    });
    //--------- FIM PROMISE --------------//
    return resultado;
  }
  
  //-----------------------------------------------------------------------------------------//

  async excluir(aluno) {
    let connection = await this.obterConexao();      
    //--------- PROMISE --------------//
    let resultado = new Promise(function(resolve, reject) {
      let transacao = connection.transaction(["AlunoST"], "readwrite");
      transacao.onerror = event => {
        reject(new ModelError("Não foi possível excluir o aluno", event.target.error));
      };
      let store = transacao.objectStore("AlunoST");
      let indice = store.index('idxMatricula');
      var keyValue = IDBKeyRange.only(aluno.getMatricula());
      indice.openCursor(keyValue).onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.matricula == aluno.getMatricula()) {
            // Solicito ao cursor para remover o objeto Aluno
            const request = cursor.delete();
            request.onsuccess = function() { 
              resolve(true); 
            };
            return;
          }
        } else {
          reject(new ModelError("Aluno com a matrícula " + aluno.getMatricula() + " não encontrado!",""));
        }
      };
    });
    //--------- FIM PROMISE --------------//
    return await resultado;
  }

  //-----------------------------------------------------------------------------------------//
}
