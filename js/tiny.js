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
	asm:"",
	
	LCount:0,
	
	
	Look:"",
	Token:"",
	Value:"",
	
	
	ST:{},
	SType:{},
	params:{},
	NumParams:0,
	
	KWlist:{'IF':"i",'ELSE':"l",'ENDIF':"e",
	       'WHILE':"w",'ENDWHILE':"e",
		   'READ':"R",'WRITE':"W",'VAR':"v",'END':"e","PROCEDURE":"p"},
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
	ParamNumber:function(N){
	    return this.params[N];
	},
	IsParam:function(N){
	    return !!this.params[N];
	},
	AddParam:function(Name){
	    if(this.IsParam(Name)) this.Duplicate(Name);
		this.NumParams++;
		this.params[Name]=this.NumParams;
	},
	CheckTable:function(N){
	    if(!this.InTable(N)&&!this.IsParam(N)){
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
	TypeOf:function(N){
	    if(this.IsParam(N)){
		    return 'f';
		}else {
			    return this.ST[N];
		}
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
	LoadParam:function(N){
	    var Offset;
		Offset = 8+4*(this.Base-N);
		this.Emit('MOVE ');
		this.WriteLn(Offset+"(A6),D0");
		this.printCode("ldi_dw","$b",Offset);
		this.printCode("add","$b","$fp");
		this.printCode("ldin_dw","$t0","$b");
	},
	StoreParam:function(N){
	    var Offset;
		Offset = 8+4*(this.Base-N);
		this.Emit("MOVE D0,");
		this.WriteLn(Offset+"(A6)");
		
		this.printCode("ldi_dw","$b",Offset);
		this.printCode("add","$b","$fp");
		this.printCode("stin_dw","$b","$t0");
	},
	PostLabel:function(L){
	    this.Write(L+":\n");
		//this.bitcode.push({gdef:L});
		this.printCode({gdef:L});
	},
	Clear:function(){
	    this.EmitLn("CLR D0");
		this.printCode("sub","$t0","$t0");
	},
	Negate:function(){
	    this.EmitLn("NEG D0");
	},
	NotIt:function(){
	    this.EmitLn("NOT D0");
	},
	printCode:function(f,v){
	    if(typeof(f)=="string") {
		   this.asm+="\t"+f;
		   this.bitcode.push(this.IS[f]);
		   for(var i=1;i<arguments.length;i++){
		       var arg = arguments[i];
			   if(typeof(arg)=="string"){
			       if(typeof(this.REG[arg])!="undefined"){
				       this.bitcode.push(this.REG[arg]);
					   this.asm+=" "+arg;
				   } else {
				       this.bitcode.push({ref:arg},0,0,0);
					   this.asm+=" "+arg;
				   }
			   } else if(typeof(arg)=="number"){
			       this.asm+=" "+arg;
				   this.bitcode.push(arg&0xFF,(arg>>>8)&0xFF,(arg>>>16)&0xFF,(arg>>>24)&0xFF);
			   }
		   } 
		   
		} else  if("gdef" in f){
		   this.bitcode.push(f);
		   this.asm+=f.gdef+":\n";
		}else if("dwdef" in f){
		       this.bitcode.push(f,v&0xFF,(v>>>8)&0xFF,(v>>>16)&0xFF,(v>>>24)&0xFF);
			   this.asm+=f.dwdef+":\n";
			   this.asm+="def dw "+v;
		}
		this.asm+="\n";
	},
	LoadConst:function(n){
	    this.Emit('MOVE #');
		this.WriteLn(n+',D0');
		//this.asm+=
		//this.bitcode.push(this.IS["ldi_dw"],this.REG["$t0"],n&0xFF,(n>>>8)&0xFF,(n>>>16)&0xFF,(n>>>24)&0xFF);
		this.printCode("ldi_dw","$t0",parseInt(n,10));
	},
	LoadVar:function(Name){
	    if(!this.InTable(Name)) {
		    this.Undefined(Name);
		}
		this.EmitLn("MOVE "+Name+'(PC),D0');
		this.printCode("ldi_dw","$t0",Name);
		this.printCode("ldin_dw","$t0","$t0");
		//this.bitcode.push(this.IS["ldi_dw"],this.REG["$t0"],{ref:Name},0,0,0);
	},
	Push:function(){
	    this.EmitLn('MOVE D0,-(SP)');
		this.printCode("push_dw","$t0");
	},
	PopAdd:function(){
	    this.EmitLn("ADD (SP)+,D0");
		this.printCode("pop_dw","$b");
		this.printCode("add","$t0","$b");
	},
	PopSub:function(){
	   
		
	    this.EmitLn("SUB (SP)+,D0");
		this.EmitLn("NEG D0");
		
		this.printCode("pop_dw","$b");
		this.printCode("sub","$b","$t0");
		this.printCode("mv","$t0","$b");
	},
	PopMul:function(){
	    this.EmitLn("MUL (SP)+,D0");
		this.printCode("pop_dw","$b");
		this.printCode("mul","$t0","$b");
	},
	PopDiv:function(){
	    this.EmitLn("MOVE (SP)+,D7");
		this.EmitLn("EXT.L D7");
		this.EmitLn("DIVS D0,D7");
		this.EmitLn("MOVE D7,D0");
		this.printCode("pop_dw","$b");
		this.printCode("div","$b","$t0");
		this.printCode("mv","$t0","$b");
	},
	Store:function(Name){
	    if(!this.InTable(Name)){
		    this.Undefined(Name);
		}
		this.EmitLn("LEA "+Name+"(PC),A0");
		this.EmitLn("MOVE D0,(A0)");
		this.printCode("st",Name,"$t0");
		//this.bitcode.push(this.IS["st"],{ref:Name},0,0,0,this.REG["$t0"]);
	},
	ProcProlog:function(N,k){
	    this.PostLabel(N);
		this.Emit("LINK A6,#");
		this.WriteLn(""+-2*k);
		this.printCode("push_dw","$ra");
		this.printCode("push_dw","$fp");
		this.printCode("mv","$fp","$sp"); // establish new framepointer
	},
	ProcEpilog:function(){
	    this.EmitLn("UNLK A6");
		
		this.printCode("pop_dw","$fp");
		this.printCode("pop_dw","$ra");
		this.Return();
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
		this.printCode("ldi_dw","$b",L);
		this.printCode("jmp","$b");
	},
	BranchFalse:function(L){
	    this.EmitLn("TST D0");
		this.EmitLn("BEQ "+L);
		this.printCode("ldi_dw","$b",L);
		this.printCode("jmpz","$t0","$b");
	},
	ReadIt:function(){
	    this.EmitLn("BSR READ");
		this.Store(this.Value[1]);
	},
	WriteIt:function(){
	    this.EmitLn("BSR WRITE");
		this.printCode("push_dw","$a");
		this.printCode("mv","$a","$t0");
		this.bitcode.push(this.IS["syscall"],0);
		this.asm+="\tsyscall 0\n";
		this.printCode("pop_dw","$a");
		/*this.bitcode.push(this.IS["push_dw"],this.REG["$a"]);
		this.bitcode.push(this.IS["mv"],this.REG["$a"],this.REG["$t0"]);
		this.bitcode.push(this.IS["syscall"],0);
		this.bitcode.push(this.IS["pop_dw"],this.REG["$a"]);*/
	},
	Define:function(Name,Val){
	    this.WriteLn(Name+":"+this.TAB+"DC "+Val);
		var val = parseInt(Val,10);
		this.printCode({dwdef:Name},val);
		//this.bitcode.push({dwdef:Name},val&0xFF,(val>>>8)&0xFF,(val>>>16)&0xFF,(val>>>24)&0xFF);
	},
	Header:function(){
	    this.WriteLn("WARMST"+this.TAB+"EQU $A01E");
		this.printCode("ldi_dw","$b","MAIN");
		this.printCode("call","$b");
		this.printCode("halt");
		/*this.bitcode.push(this.IS["ldi_dw"],this.REG["$b"],{ref:"MAIN"},0,0,0);
        this.bitcode.push(this.IS["call"],this.REG["$b"]);
		this.bitcode.push(this.IS["halt"]);*/
	},
	CleanStack:function(N){
	    if(N>0){
		    this.Emit("ADD #");
			this.WriteLn(N+" ,SP");
			this.printCode("ldi_dw","$b",N);
			//this.bitcode.push(this.IS["ldi_dw"],this.REG["$b"],N,0,0,0);
			this.printCode("add","$sp","$b");
			//this.bitcode.push(this.IS["add"],this.REG["$sp"],this.REG["$b"]);
		}
	},
	Return:function(){
	    this.EmitLn("RTS");
		this.printCode("ret");
	//	this.bitcode.push(this.IS["ret"]);
	},
	Call:function(N){
	    this.EmitLn("BSR "+N);
		this.printCode("ldi_dw","$b",N);
		this.printCode("call","$b");
		/*this.bitcode.push(this.IS["ldi_dw"],this.REG["$b"],{ref:N},0,0,0);
        this.bitcode.push(this.IS["call"],this.REG["$b"]);*/
	},
	Prolog:function(){
	    //this.PostLabel("MAIN");
	},
	Epilog:function(){
	    this.EmitLn("DC WARMST");
		//this.EmitLn("END MAIN");
		
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
			    if(this.IsParam(this.Value)){
				  this.LoadParam(this.ParamNumber(this.Value));
				} else {
			     this.LoadVar(this.Value);
				}
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
	   if(this.IsParam(Name)){
	       this.StoreParam(this.ParamNumber(Name));
	   } else{
	       this.Store(Name);
	   }
	},
	DoIf:function(){
	    var L1,L2;
		this.Next();
		this.BoolExpression();
		L1=this.NewLabel();
		L2 = L1;
		this.BranchFalse(L1);
		this.Block();
		if(this.Token=="l"){
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
	    while (this.Token!="e"&&this.Token!="l"){
		   switch(this.Token){
		   case "i": this.DoIf();break;
		   case "w": this.DoWhile();break;
		   case "R": this.DoRead(); break;
		   case "W": this.DoWrite(); break;
		   case "x": this.AssignOrProc();break;
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
	FormalList:function(){
	    this.Next();
	    this.MatchString("(");
		    while(this.Token!=")"){
			    this.FormalParam();
				while(this.Token==","){
				    this.MatchString(",");
					this.FormalParam();
				}
			}
		this.MatchString(")");
		this.Base = this.NumParams;
		this.NumParams = this.NumParams+4;
	},
	LocDecl:function(Name){
	    this.Scan();
		this.MatchString("VAR");
		this.AddParam(this.Value);
		this.Next();
	},
	LocDecls:function(){
	    var n=0;
		this.Scan();
		while(this.Token=="v"){
		    this.LocDecl();
			this.Semi();
			this.Scan();
			n++;
		}
		return n;
	},
	FormalParam:function(){
	     this.AddParam(this.Value);
	     this.Next();
	},
	Param:function(){
	    this.Expression();
		this.Push();
	    //this.Next();
	},
	ParamList:function(){
	    var N=0;
	    this.Next();
	    this.MatchString("(");
		    while(this.Token!=")"){
			    this.Param();
				N++;
				while(this.Token==","){
				    this.MatchString(",");
					this.Param();
					N++;
				}
			}
		this.MatchString(")");
		return 4*N;
	},
	CallProc:function(Name){
	    var N=this.ParamList();
		this.Call(Name);
		this.CleanStack(N);
	},
	TopDecls:function(){
	   this.Scan();
	   while(this.Token=="v"||this.Token=="p"){
	      switch(this.Token){
	           case "v": this.Alloc();
		       while(this.Token==","){
		           this.Alloc();
		       }
		       this.Semi();  break;
			   case "p": this.DoProc(); break;
		   }
		   this.Scan();
	   }
	},
	Init:function(){
	    this.ST={};
		this.ClearParams();
		this.bitcode=[];
		this.Value=this.Look=this.Token=this.output="";
		this.curPos=0;
		this.asm="";
	    this.GetChar();
		this.Next();
	},
	AssignOrProc:function(){
	    var Name = this.Value;
		switch(this.TypeOf(Name)){
		    case "f":
		    case "v": this.Assignment(); break;
			case "p": this.CallProc(Name); break;
			case " ": this.Undefined(this.Name); break;
			default: this.Abort("Identifier  "+this.Name+" cannot be used here");
		}
	},
	DoProc:function(){
	    var N;
	    this.MatchString("PROCEDURE");
		N = this.Value;
		this.FormalList();
		this.AddEntry(N,"p");
		var k = this.LocDecls();
		this.ProcProlog(N,k);
		this.BeginBlock();
        this.ProcEpilog();
		this.ClearParams();
	},
	ClearParams:function(){
	    this.params={};
		this.NumParams=0;
	},
	BeginBlock:function(){
	    this.MatchString("BEGIN");
		this.Prolog();
		this.Block();
		this.MatchString("END");
	},
    Compile:function(){
	     this.Init();
		 this.MatchString("PROGRAM");
		 this.Semi();
		 this.Header();
		 this.TopDecls();
		 this.Epilog();
		 /*this.MatchString("BEGIN");
		 this.Prolog();
		 this.Block();
		 this.MatchString("END");
		 this.Epilog();*/
    }	
	
};