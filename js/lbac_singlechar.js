var LBAC={
    input:"",
	output:"",
	TAB:'\t',
	CR:'\n',
	Look:"",
	curPos:0,
	Write:function(s){
	    this.output+=s;
	},
	Read:function(){
	    if(this.curPos>=this.input.length){}// throw new Error("Reading past available input at "+this.curPos); 
	    return this.input[this.curPos++];
	},
	GetChar:function(){
	    this.Look=this.Read();
	},
	Error:function(s){
	    this.output+='\nError: '+s+'.\n';
	},
	Abort:function(s){
	   this.Error(s);
	   throw new Error("Halt");
	},
	Expected:function(x){
	    this.Abort(x+" Expected");
	},
	Match:function(x){
	    if(this.Look==x){
		    this.GetChar();
		} else {
		    this.Expected("'"+x+"'");
		}
	},
	isAlpha:function(x){
	    if(x&&x.length!==1) throw new Error("LBAC.isAlpha single character argument expected");
	    return /[a-zA-Z]/.test(x);
	},
	isDigit:function(x){
	    if(x&&x.length!==1) throw new Error("LBAC.isDigit single character argument expected");
	    return /[0-9]/.test(x);
	},
	GetName:function(){
	    if(!this.isAlpha(this.Look)) this.Expected("Name");
		var ret= this.Look.toUpperCase();
		this.GetChar();
		return ret;
	},
	GetNum:function(){
	    if(!this.isDigit(this.Look)) this.Expected("Integer");
		var ret = this.Look;
		this.GetChar();
		return ret;
	},
	Emit:function(s){
	    this.Write(this.TAB+s);
	},
	EmitLn:function(s){
	    this.Emit(s+"\n");
	},
	Init:function(){
	    this.curPos=0;
		this.output="";
	    this.GetChar();
	},
	isAddop:function(x){
	    if(x&&x.length!==1) throw new Error("LBAC.isAddop single character argument expected");
	    return /[\+\-]/.test(x);
	},
	//< factor >::=(< expression >)|< variable >|<number>
	Factor:function(){
	    if(this.Look=="("){
		    this.Match('(');
			this.Expression();
			this.Match(')');
		} else if(this.isAlpha(this.Look)){
		    this.Ident();
		} else {
	        this.EmitLn("MOVE #"+this.GetNum()+',D0');
		}
	},
	Ident:function(){
	    var Name=this.GetName();
		if (this.Look=='('){
		    this.Match('(');
			this.Match(')');
			this.EmitLn('BSR '+Name);
		} else {
		    this.EmitLn('MOVE '+Name+'(PC),D0');
		}
	},
	Multiply:function(){
	    this.Match('*');
		this.Factor();
		this.EmitLn('MULS (SP)+,D0');
	},
	Divide:function(){
	    this.Match('/');
		this.Factor();
		this.EmitLn('MOVE (SP)+,D1');
		this.EmitLn('DIVS D1,D0');
	},
	//<term> ::= <factor> [ <mulop> <factor ]*
	Term:function(){
	    this.Factor();
		while(this.Look in {"*":true,"/":true}){
		    this.EmitLn('MOVE D0,-(SP)');
			switch(this.Look){
			   case "*": this.Multiply();break;
			   case "/": this.Divide();break;
			   default: this.Expected('Mulop');
			}
		}
	},
	Add:function(){
	    this.Match('+');
		this.Term();
		this.EmitLn('ADD (SP)+,D0');
	},
	Subtract:function(){
	    this.Match('-');
		this.Term();
		this.EmitLn('SUB (SP)+,D0');
		this.EmitLn('NEG D0');
	},
	//<expression> ::= <term> [<addop> <term>]*
	Expression:function(){
	    if(this.isAddop(this.Look)){
		    this.EmitLn('CLR D0');
		} else {
	        this.Term();
		}
		while(this.isAddop(this.Look)){
		  this.EmitLn('MOVE D0,-(SP)');
		  switch (this.Look){
		     case '+': this.Add(); break;
		     case '-': this.Subtract();break;
		     default: this.Expected('Addop');
		    }
		}
		
	},
	//< Ident >=< Expression >
	Assignment:function(){
	    var Name = this.GetName();
		this.Match('=');
		this.Expression();
		this.EmitLn('LEA '+Name+'(PC),A0');
		this.EmitLn('MOVE D0,(A0)');
	},
	Main:function(){
	    this.Init();
		this.Assignment();
		if(this.Look!=this.CR) this.Expected('NewLine');
	}
	
	
};