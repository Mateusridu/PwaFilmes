import ModelError from "/ModelError.js";
import Aluno from "/Aluno.js";

export default class AlunoDTO {
    
  //-----------------------------------------------------------------------------------------//

  #matricula;
  #cpf;
  #nome;
  #email;
  #telefone;  
  
  constructor(aluno) {
    this.#matricula = aluno.getMatricula();
    this.#cpf = aluno.getCpf();
    this.#nome = aluno.getNome();
    this.#email = aluno.getEmail();
    this.#telefone = aluno.getTelefone();      
  }
  
  //-----------------------------------------------------------------------------------------//

  getMatricula() {
    return this.#matricula;
  }
  
  //-----------------------------------------------------------------------------------------//

  getCpf() {
    return this.#cpf;
  }
  
  //-----------------------------------------------------------------------------------------//

  getNome() {
    return this.#nome;
  }
  
  //-----------------------------------------------------------------------------------------//

  getEmail() {
    return this.#email;
  }
  
  //-----------------------------------------------------------------------------------------//

  getTelefone() {
    return this.#telefone;
  }
    
  //-----------------------------------------------------------------------------------------//
   
  toJSON() {
    return '{ ' +
      '"matricula" : "' + this.#matricula + '",' 
      '"cpf" : "'       + this.#cpf + '",' 
      '"nome" : "'      + this.#nome + '",' 
      '"email" : "'     + this.#email + '",' 
      '"telefone" : "'  + this.#telefone + '"' 
      '}';
  }
}
