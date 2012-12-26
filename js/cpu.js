// process next intruction
function CPU(){}
CPU.InstructionSet={
    CodeToName:{},
	NameToCode:{},
    Instructions:{
	
	// misc instructions;
        "nop":{size:1,code:0,impl:function(cpu){ 
		     cpu._nop();
		}},
	    "syscall":{size:2,code:1,impl:function(cpu){ 
		     cpu._syscall(); 
		}},
	    "halt":{size:1,code:2,impl:function(cpu){
		    cpu._halt();
		}},
		
		// data transfer instructions
		
		"mv":{size:3,code:64,impl:function(cpu){     //mov r[a]<-r[b]
		    cpu._mv();
		}},
		"ld":{size:6,code:65,impl:function(cpu){
		    cpu._ld();
		}},  
		"ldi_dw":{size:6,code:66,impl:function(cpu){
		    cpu._ldi_dw();
		}},
		"st":{size:6,code:67,impl:function(cpu){
		    cpu._st();
		}},
		"sti":{size:9,code:68,impl:function(cpu){
		    cpu._sti();
		}},
		"pushr":{size:2,code:69,impl:function(cpu){
		    cpu._pushr();
		}},
		"popr":{size:2,code:70,impl:function(cpu){
		    cpu._popr();
		}},
		"ldin":{size:3,code:71,impl:function(cpu){
		    cpu._ldin();
		}},
		"ldi":{size:3,code:72,impl:function(cpu){
		    cpu._ldi();
		}},
		"push_dw":{size:2,code:73,impl:function(cpu){
		    cpu._push_dw();
		}},
		"pop_dw":{size:2,code:74,impl:function(cpu){
		    cpu._pop_dw();
		}},
		"ldin_dw":{size:3,code:75,impl:function(cpu){
		    cpu._ldin_dw();
		}},
		"stin_dw":{size:3,code:76,impl:function(cpu){
		    cpu._stin_dw();
		}},
		// Arithmatic insturctions
		
		"add":{size:3,code:128,impl:function(cpu){
		    cpu._add();
		}},
		"sub":{size:3,code:129,impl:function(cpu){
		    cpu._sub();
		}},
	    "mul":{size:3,code:130,impl:function(cpu){
		    cpu._mul();
		}},
		"div":{size:3,code:131,impl:function(cpu){
		    cpu._div();
		}},
		// control instructions
		
		"call":{size:2,code:192,impl:function(cpu){
		    cpu._call();
		}},
		"ret":{size:1,code:193,impl:function(cpu){
		    cpu._ret();
		}},
		"jmp":{size:2,code:194,impl:function(cpu){
		    cpu._jmp();
		}},
		"jmpz":{size:3,code:195,impl:function(cpu){
		    cpu._jmpz();
		}}
	},
	
	
	
};

(function(){
    for(var x in CPU.InstructionSet.Instructions){
	   CPU.InstructionSet.CodeToName[CPU.InstructionSet.Instructions[x].code]=x;
	   CPU.InstructionSet.NameToCode[x]=CPU.InstructionSet.Instructions[x].code;
	}
	var _regNames=[
		     "$a","$b","$c","$sp","$fp","$t0","$t1","$t2","$t3","$t4",
			 "$t7","$t8","$t9","$t10","$t11","$t12","$t13","$t14","$t15","$t16",
			 "$t17","$t18","$t19","$20","$t21","$t22","$t23","$t24","$t25","$ra",
			 "$flags","$pc"
		 ];
    CPU.REG={};
	for(var i=0;i<_regNames.length;i++) CPU.REG[_regNames[i]]=i;
})();
CPU.prototype={
     init:function(memSize,inStr,outStr){
	     this._instrMap={};
		 this._inStream  = inStr;
		 this._outStream = outStr;
		 this._mem=new Array(memSize);
		
		 var misc=[
		       [this._nop,1],/*0*/  // just increments the program counter 
			   [this._syscall,1], /*1*/
			   [this._halt,1] /*2*/
			 ];
			 // data move instructions
		 var data_mov=
       		[ 
			  [this._mv,3],/*64*/  // mv dadr,sadr // mov r[a]<-r[b]
			  [this._ld,6],/*65*/        // load double word from memory    mov r[a]<-M[b](4)
			  [this._ldi_dw,6], /*66*/   // load double word immediate      mov r<-b  (4)
			  [this._st,6], /*67*/       // store double word from register mov M[a]<-r[b] (4)
			  [this._sti,9], /*68*/      // store double word immediate     mov M[a]<-b (4)
			  [this._pushr,2],/*69*/     // push double word from register  --r[$sp], mov M[r[$sp]]<-r[a] (1)
			  [this._popr,2], /*70*/     // pop double word to register     mov r[a]<-M[r[$sp]], ++r[$sp] 
			  [this._ldin,3] /*71*/      // load byte indirect       mov r[a]<-M[r[b]]
			 ];
	    var arith=[		  
			 // arithmatic instrucions
			    [this._add,3], /*128*/   //                                  r[a]=r[a]+r[b]
			    [this._sub,3] /*129*/    //                                  r[a]=r[a]-r[b]                               
			 ];
			 // control instructions
		var ctrl=[
             [this._call,2], /*192*/     //                                 mov r[$ra]<-r[$pc]+2,r[$pc]<-r[a]
			 [this._ret,1],  /*193*/	 //                                 r[$pc]<-r[ra]
             [this._jmp,2] /*194*/		 //                                 r[$pc]<-r[a]
		 ];
		 // create instr map
		 // misc instr begin at 0
		 for(var i=0;i<misc.length;i++){
		     this._instrMap[i]=misc[i];
		 }
		 // data_mov instr begin at 64
		 for(var i=0;i<data_mov.length;i++){
		     this._instrMap[i+64]=data_mov[i];
		 }
		 // arith instr begin at 128
		 for(var i=0;i<arith.length;i++){
		     this._instrMap[i+128]=arith[i];
		 }
		 // ctrl instr begin at 192
		 for(var i=0;i<ctrl.length;i++){
		     this._instrMap[192+i]=ctrl[i];
		 }
		 this._regNames=[
		     "$a","$b","$c","$sp","$fp","$t0","$t1","$t2","$t3","$t4",
			 "$t7","$t8","$t9","$t10","$t11","$t12","$t13","$t14","$t15","$t16",
			 "$t17","$t18","$t19","$20","$t21","$t22","$t23","$t24","$t25","$ra",
			 "$flags","$pc"
		 ];//reg names;
		 this._regs={};
		 CPU.regs=this._regs;
		 for(var i=0;i<this._regNames.length;i++) this._regs[this._regNames[i]]=i;
		 this._regMem=new Array(32);// each array Item represents a 32 bit register;
		 this.reset();
		 return this;
	 },
	 _readUByte:function(addr){
	     return (this._mem[addr]&0xFF);
	 },
	 _writeUByte:function(addr,num){
	     this._mem[addr]=(num&0xFF)>>>0;
	 },
	 _writeUInt32:function(addr,num){
	     this._writeUByte(addr,num);
		 this._writeUByte(addr+1,num>>>8);
		 this._writeUByte(addr+2,num>>>16);
		 this._writeUByte(addr+3,num>>>24);
	 },
	 _readUInt32:function(addr){
	     var r=0;
		 r=this._readUByte(addr);
		 r|=this._readUByte(addr+1)<<8;
		 r|=this._readUByte(addr+2)<<16;
		 r|=this._readUByte(addr+3)<<24;
		 return r>>>0; 
	 },
	 reset:function(){
	     for(var i=0;i<this._regMem.length;i++){
		     this._regMem[i]=0;
		 }
		 // initialize stack pointer to end of memory
		 this._regMem[this._regs['$sp']]=this._mem.length; 
	 },
	 getInstrSize:function(instr){
	     return CPU.InstructionSet.Instructions[CPU.InstructionSet.CodeToName[instr]].size;
	 },
	 start:function(){
	    this._next_instr();
	 },
	 writeMem:function(addr,word){
	     this._mem[addr]=word;
	 },
	 readMem:function(addr){
	     return this._mem[addr];
	 },
	_regVal:function(idx){
	    return this._regMem[idx];
	},
	_setReg:function(idx,val){
	    return this._regMem[idx]=val;
	},
	_incPC:function(v){
	    this._regMem[this._regs['$pc']]+=(v?v:1);
	},
    _pc:function(){
	    return this._regVal(this._regs['$pc']);
	},
	setDebugCallback:function(cb){
	    this._debuggerCallback=cb;
	},
	doNext:function(){
	    if(this._halted){
		   console.log("CPU already halted");
		   return;
		}
	    this._decodeInstr(this._readInstr()).call(this,this);
	},
    _next_instr:function(){
	    (this._debuggerCallback||this.doNext).call(this);
    },
	_readInstr:function(){
	    return this._mem[this._pc()];
	},
	_decodeInstr:function(instr){
	    //console.log("decodding "+instr);
		//console.log(this._regMem);
	    return CPU.InstructionSet.Instructions[CPU.InstructionSet.CodeToName[instr]].impl;
	},
	// methods defining instructions
	_nop:function(){
	    this._incPC();
		this._next_instr();
	},
	_mv:function(){
	    var pc=this._regMem[this._regs['$pc']];
	    this._regMem[this._mem[pc+1]]=this._regMem[this._mem[pc+2]];
	    this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_ld:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=this._mem[this._mem[pc+2]];
	   this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_ldi_dw:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=this._readUInt32(pc+2);
	    this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_ldi:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=this._mem[pc+2];
	    this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	},
	_ldin:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=this._mem[this._regMem[this._mem[pc+2]]];
	    this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_ldin_dw:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=this._readUInt32(this._regMem[this._mem[pc+2]]);
	    this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	},
	_stin_dw:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._writeUInt32(this._regMem[this._mem[pc+1]],this._regMem[this._mem[pc+2]]);
	    this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	},
	_st:function(){
	    var pc=this._regMem[this._regs['$pc']];
		var addr = this._readUInt32(pc+1);
		//this._mem[this._mem[pc+1]]=this._regMem[this._mem[pc+2]];
		this._writeUInt32(addr,this._regMem[this._mem[pc+5]]);
	   this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	},
	_sti:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._mem[this._mem[pc+1]]=this._mem[pc+2];
	    this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_add:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]+=this._regMem[this._mem[pc+2]];
	    this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_sub:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]-=this._regMem[this._mem[pc+2]];
	    this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_mul:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]*=this._regMem[this._mem[pc+2]];
	    this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	},
	_div:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=~~(this._regMem[this._mem[pc+1]]/this._regMem[this._mem[pc+2]]);
	    this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	},
	_subi:function(){
	     var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]-=this._mem[pc+2];
	   this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_addi:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]+=this._mem[pc+2];
	   this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_call:function(){
	    var pc=this._regMem[this._regs['$pc']];
		var addr=this._regMem[this._mem[pc+1]];
		this._regMem[this._regs['$ra']]=pc+this._instrMap[this._mem[pc]][1]; // store return address
		this._regMem[this._regs['$pc']]=addr;
		this._next_instr();
	},
	_jmp:function(){
	    var pc=this._regMem[this._regs['$pc']];
		var addr=this._regMem[this._mem[pc+1]];
		this._regMem[this._regs['$pc']]=addr;
		this._next_instr();
	},
	_jmpz:function(){
	    var pc=this._regMem[this._regs['$pc']];
		var val = this._regMem[this._mem[pc+1]];
		var addr=this._regMem[this._mem[pc+2]];
		if(val!=0){
		   this._incPC(this.getInstrSize(this._mem[pc]));
		} else {
		   this._regMem[this._regs['$pc']]=addr;
		}
		
		this._next_instr();
	},
	_ret:function(){
	     // load return address in program counter
	    this._regMem[this._regs['$pc']]=this._regMem[this._regs['$ra']];
		this._next_instr();
	},
	_push_dw:function(){
	     var pc=this._regMem[this._regs['$pc']];
		 this._regMem[this._regs['$sp']]-=4;
		 this._writeUInt32(this._regMem[this._regs['$sp']],this._regMem[this._mem[pc+1]]);
		 this._incPC(this.getInstrSize(this._mem[pc]));
		 this._next_instr();
	},
	_pop_dw:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=this._readUInt32(this._regMem[this._regs['$sp']]);
		this._regMem[this._regs['$sp']]+=4;
		this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	},
	_pushr:function(){
	     var pc=this._regMem[this._regs['$pc']];
		 this._regMem[this._regs['$sp']]--;
		 this._mem[this._regMem[this._regs['$sp']]]=this._regMem[this._mem[pc+1]];
		 this._incPC(this._instrMap[this._mem[pc]][1]);
		 this._next_instr();
	},
	_popr:function(){
	    var pc=this._regMem[this._regs['$pc']];
		this._regMem[this._mem[pc+1]]=this._mem[this._regMem[this._regs['$sp']]];
		this._regMem[this._regs['$sp']]++;
		this._incPC(this._instrMap[this._mem[pc]][1]);
		this._next_instr();
	},
	_halt:function(){
	   this._halted=true;
	   this._incPC();
	},
	_syscall:function(){
	    var pc=this._regMem[this._regs['$pc']];
	    var calltype=this._readUByte(pc+1);
		switch(calltype){
		   case 0:
		      // here we will write to output stream;
			      this._outStream.write(this._regMem[this._regs["$a"]]&0xFF);
		   break;
		   case 1:
			      this._regMem[this._regs["$a"]] = this._inStream.read();
		   break;
		   default:
		     throw new Error("Undefined Syscall");
		   break;
		}
	    this._incPC(this.getInstrSize(this._mem[pc]));
		this._next_instr();
	}
	
	
};