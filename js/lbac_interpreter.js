var INTER={
    source:"",
	input:"",
	output:"",
	TAB:'\t',
	CR:'\n',
	LF:'\r',
	Look:"",
	curPos:0,
	Write:function(s){
	    this.output+=s;
	},
	ReadInp:function(){
		return parseInt(this.lines.shift(),10);
	},
	Read:function(){
	    if(this.curPos>=this.source.length){}// throw new Error("Reading past available input at "+this.curPos); 
	    return this.source[this.curPos++];
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
			this.SkipWhite();
		} else {
		    this.Expected("'"+x+"'");
		}
	},
	isAlpha:function(x){
	    if(x&&x.length!==1) throw new Error("LBAC.isAlpha single character argument expected");
	    return /[a-zA-Z]/.test(x)&&x;
	},
	isDigit:function(x){
	    if(x&&x.length!==1) throw new Error("LBAC.isDigit single character argument expected");
	    return /[0-9]/.test(x);
	},
	isAlNum:function(x){
	    return this.isAlpha(x)||this.isDigit(x);
	},
	isWhite:function(x){
	   return x==" "||x==this.TAB;
	},
	SkipWhite:function(){
	    while(this.isWhite(this.Look)){
		    this.GetChar();
		}
	},
	GetName:function(){
	    if(!this.isAlpha(this.Look)) this.Expected("Name");
		var Token="";
		while(this.isAlNum(this.Look)){
		    Token += this.Look.toUpperCase();
			this.GetChar();
		}
		this.SkipWhite();
		return Token;
	},
	GetNum:function(){
	    if(!this.isDigit(this.Look)) this.Expected("Integer");
		var Value=0;
        while(this.isDigit(this.Look)){
		    Value=Value*10+this.Look.charCodeAt(0)-"0".charCodeAt(0);;
			this.GetChar();
        }
		this.SkipWhite();
		return Value;
	},
	Emit:function(s){
	    this.Write(this.TAB+s);
	},
	EmitLn:function(s){
	    this.Emit(s+"\n");
	},
	InitTable:function(){
	    this.Table=(function(){
		    var tbl={};
		    return  function(id,val){  
		        if(arguments.length<2){  // get call
			       return tbl[id]||0;
			    } else {  // set call
				   tbl[id]=val;
			    }
			 };
		})();
	},
	Init:function(){
	    this.curPos=0;
		this.output="";
	    this.GetChar();
		this.SkipWhite();
		this.lines  = this.input.split("\n");
		this.InitTable();
	},
	isAddop:function(x){
	    if(x&&x.length!==1) throw new Error("LBAC.isAddop single character argument expected");
	    return /[\+\-]/.test(x);
	},
	//< factor >::=(< expression >)|< variable >|<number>
	Factor:function(){
	    var Value;
	    if(this.Look=="("){
		    this.Match('(');
			Value = this.Expression();
			this.Match(')');
		} else if(this.isAlpha(this.Look)){
		    return this.Ident();
		} else {
	        Value=this.GetNum();
		}
		return Value;
	},
	Ident:function(){
	    var Name=this.GetName();
		if (this.Look=='('){
		    this.Match('(');
			this.Match(')');
			return this.Table(Name)();
		} else {
		    return this.Table(Name);
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
	    var Value = this.Factor();
		while(this.Look in {"*":true,"/":true}){
			switch(this.Look){
			   case "*": this.Match("*");
			             Value*=this.Factor(); break;
			   case "/": this.Match("/");
			             Value=~~(Value/this.Factor()); break;
			   default: this.Expected('Mulop');
			}
		}
		return Value;
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
	    var Value;
	    if(this.isAddop(this.Look)){
		    Value=0;
		} else {
			Value=this.Term();
		}
		while(this.isAddop(this.Look)){
		  switch (this.Look){
		     case '+': this.Match('+');
			           Value=Value+this.Term(); 
					   break;
		     case '-': this.Match('-');
			           Value =Value-this.Term();
					   break;
		     default: this.Expected('Addop');
		    }
		}
		return Value;
		
	},
	NewLine:function(){// eats \r\n or \n or \r
	    if(this.Look==this.CR){
		    this.GetChar();
			if(this.Look==this.LF){
			    this.GetChar();
			}
		} else if(this.Look==this.LF){
		    this.GetChar();
		}
	},
	//< Ident >=< Expression >
	Assignment:function(){
	    var Name = this.GetName();
		this.Match('=');
		var Value = this.Expression();
		this.Table(Name,Value);
	},
	Input:function(){
	    this.Match("?");
		var Name = this.GetName();
		this.Table(Name,this.ReadInp());
	},
	Output:function(){
	    this.Match("!");
		this.Write(this.Table(this.GetName())+"\n");
	},
	Main:function(){
	    this.Init();
		do {
		   switch(this.Look){
		      case "?": this.Input(); break;
			  case "!": this.Output();break;
			  default:  this.Assignment();break;
		   }
		   
		   this.NewLine();
		}while(this.Look!=".");
		//this.Write(this.Assignment()+"\n");
		//this.
		if(this.Look!=this.CR) this.Expected('NewLine');
	}
	
	
};