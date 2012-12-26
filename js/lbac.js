var LBAC={
    input:"",
	output:"",
	TAB:'\t',
	CR:'\n',
	Look:"",
	curPos:0,
	LCount:0,
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
	DoIf:function(){
	    var L1,L2;
		
		this.Match("i");
		this.Condition();
		L1=this.NewLabel();
		L2 = L1;
		this.EmitLn("BEQ "+L1);
		this.Block();
		if(this.Look=="l"){
		    this.Match("l");
			L2 = this.NewLabel();
			this.EmitLn("BRA "+L2);
			this.PostLabel(L1);
			this.Block();
		}
		this.Match('e');
		this.PostLabel(L2);
	},
	NewLabel:function(){
	    return "L"+(this.LCount++);
	},
	PostLabel:function(L){
	    this.Write(L+":\n");
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
		var Token=this.Look;
		this.GetChar();
		return Token;
	},
	GetNum:function(){
	    if(!this.isDigit(this.Look)) this.Expected("Integer");
		var Value="";
        while(this.isDigit(this.Look)){
		    Value+=this.Look;
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
	Init:function(){
	    this.curPos=0;
		this.output="";
	    this.GetChar();
		this.SkipWhite();
	},
	//<program>::=<block>END
	DoProgram:function(){
	    this.Block();
		if(this.Look!="e") this.Expected('End');
		this.EmitLn("END");
	},
	//<block>:[<statement>]*
	Block:function(){
	    while (this.Look!="e"&&this.Look!="l"){
		   switch(this.Look){
		   case "i": this.DoIf();break;
		   default: this.Other();break;
		   }
		}
	},
	Condition:function(){
	    this.EmitLn('<condition>');
	},
	Other:function(){
	    this.EmitLn(this.GetName());
	},
	Main:function(){
	    this.Init();
		this.DoProgram();
		//sif(this.Look!=this.CR) this.Expected('NewLine');
	}
	
	
};