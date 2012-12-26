var TINY={
    input:"",
	output:"",
	bitcode:[],
	curPos:0,
	IS:CPU.InstructionSet.NameToCode,
	REG:CPU.REG,
	TAB:'\t',
	CR:'\n',
	LF:'\r',
	
	LCount:0,
	
	
	Look:"",
	Token:"",
	Value:"",
	
	
	ST:{},
	SType:{},
	
	KWlist:{'IF':"i",'ELSE':"l",'ENDIF':"e",
	       'WHILE':"w",'ENDWHILE':"e",
		   'READ':"R",'WRITE':"W",'VAR':"v",'END':"e"},
	KWCode:"xileweRWve",
		
	Write:function(s){
	    this.output+=s;
	},
	WriteLn:function(s){
	    this.Write(s+"\n");
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
	Undefined:function(n){
	    this.Abort("Undefined Identifier "+n);
	},
	Duplicate:function(n){
	    this.Duplicate("Duplicate Identifier "+n);
	},
	CheckIdent:function(){
	    if(this.Token!="x"){
		    this.Expected("Identifier");
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
	IsAddop:function(op){
	   return op=="+"||op=="-";
	},
	IsMulop:function(op){
	   return op=="*"||op=="/";
	},
	IsOrop:function(op){
	    return op=="|"||op=="~";
	},
	IsRelop:function(op){
	   return op=="="||
              op=="#"||
              op=="<"||
              op==">";			  
	},
	isWhite:function(x){
	   return x==" "||
	          x==this.TAB||
			  x==this.CR||
			  x==this.LF||
			  x=="{";
	},
	SkipComment:function(){
	    while(this.Look!="}"){
		    this.GetChar();
			if(this.Look=="{"){
			    this.SkipComment();
			}
		}
		this.GetChar();
	},
	SkipWhite:function(){
	    while(this.isWhite(this.Look)){
		    if(this.Look == "{"){
			    this.SkipComment();
			} else {
		        this.GetChar();
			}
		}
	},
	Lookup:function(T,s,n){
	    return this.ST[s];
	},
	Locate:function(N){
	    return this.ST[s];
	},
	InTable:function(n){
	    return !!this.ST[n];
	},
	CheckTable:function(N){
	    if(!this.InTable(N)){
		    this.Undefined(N);
		}
	},
	CheckDup:function(N){
	    if(this.InTable(N)) {
		    this.Duplicate(N);
		}
	},
	AddEntry:function(N,T){
	    this.CheckDup(N);
	    this.ST[N]=T;
	},
	GetName:function(){
	    this.SkipWhite();
	    if(!this.isAlpha(this.Look)) this.Expected("Identifier");
		this.Token="x";
		this.Value="";
		do{
		   this.Value+=this.Look.toUpperCase();
		   this.GetChar();
		}while(this.isAlNum(this.Look));
	},
	GetNum:function(){
	    this.SkipWhite();
	    if(!this.isDigit(this.Look)) this.Expected("Integer");
		this.Token="#";
		this.Value="";
        do{
		    this.Value+=this.Look;
			this.GetChar();
        }while(this.isDigit(this.Look));
	},
	GetOp:function(){
	    this.SkipWhite();
		this.Token=this.Look;
		this.Value=this.Look;
		this.GetChar();
	},
	Next:function(){
	    this.SkipWhite();
		if(this.isAlpha(this.Look)){
		    this.GetName();
		} else if(this.isDigit(this.Look)){
		    this.GetNum();
		} else {
		    this.GetOp();
		}
	},
	Scan:function(){
	    if(this.Token=="x"){
		    this.Token = this.KWlist[this.Value]||"x";
		}
	},
	Semi:function(){
	    this.MatchString(";");
	},
	MatchString:function(x){
	    if(this.Value!=x) this.Expected("'"+ x +"'");
		this.Next();
	},
	Emit:function(s){
	    this.Write(this.TAB+s);
	},
	EmitLn:function(s){
	    this.Emit(s+"\n");
	},
	NewLabel:function(){
	    return "L"+(this.LCount++);
	},
	
    //Code generation function	
	PostLabel:function(L){
	    this.Write(L+":\n");
		this.bitcode.push({gdef:L});
	},
	Clear:function(){
	    this.EmitLn("CLR D0");
	},
	Negate:function(){
	    this.EmitLn("NEG D0");
	},
	NotIt:function(){
	    this.EmitLn("NOT D0");
	},
	LoadConst:function(n){
	    this.Emit('MOVE #');
		this.WriteLn(n+',D0');
		this.bitcode.push(this.IS["ldi_dw"],this.REG["$t0"],n&0xFF,(n>>>8)&0xFF,(n>>>16)&0xFF,(n>>>24)&0xFF);
	},
	LoadVar:function(Name){
	    if(!this.InTable(Name)) {
		    this.Undefined(Name);
		}
		this.EmitLn("MOVE "+Name+'(PC),D0');
		this.bitcode.push(this.IS["ldi_dw"],this.REG["$t0"],{ref:Name},0,0,0);
	},
	Push:function(){
	    this.EmitLn('MOVE D0,-(SP)');
	},
	PopAdd:function(){
	    this.EmitLn("ADD (SP)+,D0");
	},
	PopSub:function(){
	    this.EmitLn("SUB (SP)+,D0");
		this.EmitLn("NEG D0");
	},
	PopMul:function(){
	    this.EmitLn("MUL (SP)+,D0");
	},
	PopDiv:function(){
	    this.EmitLn("MOVE (SP)+,D7");
		this.EmitLn("EXT.L D7");
		this.EmitLn("DIVS D0,D7");
		this.EmitLn("MOVE D7,D0");
	},
	Store:function(Name){
	    if(!this.InTable(Name)){
		    this.Undefined(Name);
		}
		this.EmitLn("LEA "+Name+"(PC),A0");
		this.EmitLn("MOVE D0,(A0)");
		this.bitcode.push(this.IS["st"],{ref:Name},0,0,0,this.REG["$t0"]);
	},
	
	PopAnd:function(){
	    this.EmitLn("AND (SP)+,D0");
	},
	PopOr:function(){
	    this.EmitLn("OR (SP)+,D0");
	},
	PopXor:function(){
	    this.EmitLn("EOR (SP)+,D0");
	},
	PopCompare:function(){
	    this.EmitLn("CMP (SP)+,D0");
	},
	SetEqual:function(){
	    this.EmitLn("SEQ D0");
		this.EmitLn("EXT D0");
	},
	SetNEqual:function(){
	    this.EmitLn("SNE D0");
		this.EmitLn("EXT D0");
	},
	SetGreater:function(){
	    this.EmitLn("SLT D0");
		this.EmitLn("EXT D0");
	},
	SetLess:function(){
	    this.EmitLn("SGT D0");
		this.EmitLn("EXT D0");
	},
	SetLessOrEqual:function(){
	    this.EmitLn("SGE D0");
		this.EmitLn("EXT D0");
	},
	SetGreaterOrEqual:function(){
	    this.EmitLn("SLE D0");
		this.EmitLn("EXT D0");
	},
	Branch:function(L){
	    this.EmitLn("BRA "+L);
	},
	BranchFalse:function(L){
	    this.EmitLn("TST D0");
		this.EmitLn("BEQ "+L);
	},
	ReadIt:function(){
	    this.EmitLn("BSR READ");
		this.Store(this.Value[1]);
	},
	WriteIt:function(){
	    this.EmitLn("BSR WRITE");
		this.bitcode.push(this.IS["push_dw"],this.REG["$a"]);
		this.bitcode.push(this.IS["ldin_dw"],this.REG["$a"],this.REG["$t0"]);
		this.bitcode.push(this.IS["syscall"],0);
		this.bitcode.push(this.IS["pop_dw"],this.REG["$a"]);
	},
	Define:function(Name,Val){
	    this.WriteLn(Name+":"+this.TAB+"DC "+Val);
		var val = parseInt(Val,10);
		this.bitcode.push({dwdef:Name},val&0xFF,(val>>>8)&0xFF,(val>>>16)&0xFF,(val>>>24)&0xFF);
	},
	Header:function(){
	    this.WriteLn("WARMST"+this.TAB+"EQU $A01E");
		this.bitcode.push(this.IS["ldi_dw"],this.REG["$b"],{ref:"MAIN"},0,0,0);
        this.bitcode.push(this.IS["call"],this.REG["$b"]);
		this.bitcode.push(this.IS["halt"]);
	},
	Prolog:function(){
	    this.PostLabel("MAIN");
	},
	Epilog:function(){
	    this.EmitLn("DC WARMST");
		this.EmitLn("END MAIN");
		this.bitcode.push(this.IS["ret"]);
	},
	Allocate:function(Name,Val){
	    this.Define(Name,Val);
	},
	Factor:function(){
	    if(this.Token=="("){
		    this.Next();
			this.BoolExpression();
			this.MatchString(")");
		} else {
		    if(this.Token=="x"){
			    this.LoadVar(this.Value);
			} else if(this.Token=="#"){
			    this.LoadConst(this.Value);
			} else {
			    this.Expected("Math Factor");
			}
			this.Next();
		} 
	},
	Multiply:function(){
	    this.Next();
		this.Factor();
		this.PopMul();
	},
	Divide:function(){
	    this.Next();
		this.Factor();
		this.PopDiv();
	},
	Term:function(){
	    this.Factor();
		while(this.IsMulop(this.Token)){
		    this.Push();
			switch(this.Token){
			    case "*": this.Multiply(); break;
				case "/": this.Divide(); break;
			}
		}
	},
	Add:function(){
	   this.Next();
	   this.Term();
	   this.PopAdd();
	},
	Subtract:function(){
	   this.Next();
	   this.Term();
	   this.PopSub();
	},
	Expression:function(){
	   if(this.IsAddop(this.Token)){
	       this.Clear();
	   } else {
	       this.Term();
	   }
	   while(this.IsAddop(this.Token)){
	       this.Push();
		   switch(this.Token){
		       case "+": this.Add();break;
			   case "-": this.Subtract(); break;
		   }
	   }
	},
	CompareExpression:function(){
	    this.Expression();
		this.PopCompare();
	},
	NextExpression:function(){
	    this.Next();
		this.CompareExpression();
	},
	Equal:function(){
	    this.NextExpression();
		this.SetEqual();
	},
	LessOrEqual:function(){
	    this.NextExpression();
		this.SetLessOrEqual();
	},
	NotEqual:function(){
	   this.NextExpression();
	   this.SetNEqual();
	},
	Less:function(){
	    this.Next();
		switch(this.Token){
		    case "=": this.LessOrEqual(); break;
			case ">": this.NotEqual(); break;
			default: this.CompareExpression();
			         this.SetLess();
		}
	},
	Greater:function(){
	    this.Next();
		if(this.Token=="="){
		    this.NextExpression();
			this.SetGreaterOrEqual();
		} else {
		    this.CompareExpression();
			this.SetGreater();
		}
	},
	Relation:function(){
	    this.Expression();
		if(this.IsRelop(this.Token)){
		    this.Push();
			switch(this.Token){
			    case "=": this.Equal();
				case "<": this.Less();
				case ">": this.Greater();
			}
		}
	},
	NotFactor:function(){
	    if(this.Token=="!"){
		    this.Next();
			this.Relation();
			this.NotIt();
		} else {
		    this.Relation();
		}
	},
	BoolTerm:function(){
	    this.NotFactor();
		while(this.Token=="&"){
		    this.Push();
			this.Next();
			this.NotFactor();
			this.PopAnd();
		}
	},
	BoolOr:function(){
	    this.Next();
		this.BoolTerm();
		this.PopOr();
	},
	BoolXor:function(){
	    this.Next();
		this.BoolTerm();
		this.PopXor();
	},
	BoolExpression:function(){
	    this.BoolTerm();
		while(this.IsOrop(this.Token)){
		    this.Push();
			switch(this.Token){
			    case "|" : this.BoolOr(); break;
				case "~" : this.BoolXor(); break;
			}
		}
	},
    Assignment:function(){
	   this.CheckTable(this.Value);
	   var Name=this.Value;
	   this.Next();
	   this.MatchString("=");
	   this.BoolExpression();
	   this.Store(Name);
	},
	DoIf:function(){
	    var L1,L2;
		this.Next();
		this.BoolExpression();
		L1=this.NewLabel();
		L2 = L1;
		this.BranchFalse(L1);
		this.Block();
		if(this.Token="l"){
		    this.Next();
			L2 = this.NewLabel();
			this.Branch(L2);
			this.PostLabel(L1);
			this.Block();
		}
		this.PostLabel(L2);
		this.MatchString("ENDIF");
	},
	DoWhile:function(){
	    var L1,L2;
		this.Next();
		L1 = this.NewLabel();
		L2 = this.NewLabel();
		this.PostLabel(L1);
		this.BoolExpression();
		this.BranchFalse(L2);
		this.Block();
		this.MatchString("ENDWHILE");
		this.Branch(L1);
		this.PostLabel(L2);
	},
	ReadVar:function(){
	    this.CheckIdent();
		this.CheckTable(this.Value);
		this.ReadIt(this.Value);
		this.Next();
	},
	DoRead:function(){
	    this.Next();
		this.MatchString("(");
		this.ReadVar();
		while(this.Token==","){
		    this.Next();
			this.ReadVar();
		}
		this.MatchString(")");
	},
	DoWrite:function(){
	    this.Next();
	    this.MatchString("(");
		this.Expression();
		this.WriteIt();
		while(this.Token==","){
		    this.Next();
			this.Expression();
			this.WriteIt();
		}
		this.MatchString(")");
	},
	Block:function(){
	    this.Scan();
	    while (this.Token!="e"&&this.Look!="l"){
		   switch(this.Token){
		   case "i": this.DoIf();break;
		   case "w": this.DoWhile();break;
		   case "R": this.DoRead(); break;
		   case "W": this.DoWrite(); break;
		   case "x": this.Assignment();break;
		   }
		   this.Semi();
		   this.Scan();
		}
	},
    Alloc:function(N){
	    this.Next();
		if(this.Token!="x") this.Expected("Variable expected");
		this.CheckDup(this.Value);
		this.AddEntry(this.Value,"v");
		this.Allocate(this.Value,"0");
		this.Next();
	},
	TopDecls:function(){
	   this.Scan();
	   while(this.Token=="v"){
	       this.Alloc();
		   while(this.Token==","){
		       this.Alloc();
		   }
		   this.Semi();
	   }
	},
	Init:function(){
	    this.ST={};
		this.bitcode=[];
		this.Value=this.Look=this.Token=this.output="";
		this.curPos=0;
	    this.GetChar();
		this.Next();
	},
    Compile:function(){
	     this.Init();
		 this.MatchString("PROGRAM");
		 this.Semi();
		 this.Header();
		 this.TopDecls();
		 this.MatchString("BEGIN");
		 this.Prolog();
		 this.Block();
		 this.MatchString("END");
		 this.Epilog();
    }	
	
};