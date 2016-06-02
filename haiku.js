/* Three methods of haiku generation: 
(1) Basic: Selecting random words from a dictionary
(2) Markov chain 1: Uses Markov chain to generate likely strings of words; train on any text
(3) Markov chain 2: Uses a backwards Markov chain to build the haiku backwards; train on other haikus
*/

var fs = require("fs");
var cmudictFile = readCmudictFile('./cmudict.txt');

//SHARED FUNCTIONS
function readCmudictFile(file){
  return fs.readFileSync(file).toString();
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


//FUNCTIONS FOR BASIC METHOD

/*Generates a random word structure fitting the syllabic demands 
(e.g. [5,7,5] -> [[2,3],[3,3,1],[5]])
Selects random words of the proper syllable length to fill out structure*/
function haikuBasic(structure){
	//Generate syllablesArr(data structure containing CMU dict parsed by syllables)
	var syllablesArr=formatData(cmudictFile);
	//Generate word structure (complexStructure)
	var complexStructure=[];
	for(var i=0;i<structure.length;i++){
		var availableSylls=structure[i];
		var lineStructure=[];
		while(availableSylls>0){
			var syllsInWord=getRandomIntInclusive(1,availableSylls);
			while(syllablesArr[syllsInWord]==undefined){
				syllsInWord=getRandomIntInclusive(1,availableSylls);
			}
			availableSylls-=syllsInWord;
			lineStructure.push(syllsInWord);
		}
		complexStructure.push(lineStructure);
	}
	//Choose random words from syllableArr to fill out word structure
	var poem="\n";
	for(var i=0;i<complexStructure.length;i++){
		for(var j=0;j<complexStructure[i].length;j++){
			var numSylls=complexStructure[i][j];
			var wordIndex=getRandomIntInclusive(0,syllablesArr[numSylls].length-1); 
			var word=syllablesArr[numSylls][wordIndex].replace(/[^a-zA-Z!']+/g, ""); 
			poem=poem+word+" "
		}
		poem+="\n";
	}
	console.log(poem);	
}

/*Parses the CMU dictionary; returns a syllable array; each index contains an array of words 
	from the CMU dict consisting of (index) syllables.*/
function formatData(data){ 
   var syllablesArr=[];   
   var lines = data.toString().split("\n"),
       lineSplit
   lines.forEach(function(line){  
    lineSplit = line.split("  ");    
    var word=lineSplit[0];
    var syllCount=0; //  
    if(lineSplit[1]!=undefined){
	    var phonemes=lineSplit[1].split(" ");
	    for(var i=0;i<phonemes.length;i++){
	    	if(phonemes[i].match(/\d/)){
	    		syllCount++;
	    	}
	    }
	    if(syllablesArr[syllCount]==undefined){
	    	syllablesArr[syllCount]=[word];
	    }
	    else{
	    	syllablesArr[syllCount].push(word);
	    }
	}
  }); 
  return syllablesArr;  
}

//FUNCTIONS FOR MARKOV CHAIN 1
/*Parses a text  into a frequency table
that maps words to the counts of words appearing after them;
builds chains of words, in the proper syllabic structure,
based on these frequencies*/
function haikuMarkov(structure,text){
	var syllDict=formatData2(cmudictFile);
	var text=processText(text);
	var freqTable=generateFrequencyTable(text);
	var keys=Object.keys(freqTable);
	var wordsUsed={};
	var str="";
	for(var i=0;i<structure.length;i++){
		var nextLine=getNextLine(structure[i],keys,freqTable,syllDict,wordsUsed);
		var arr=nextLine.split(" ");
		for(var j=0;j<arr.length;j++){
			wordsUsed[arr[j]]=true;
		}
		str=str+nextLine+"\n";
	}
	console.log(str);
}
/*Parses the CMU dictionary; returns a dictionary mapping each word 
to its syllable count*/
function formatData2(data){ 
   var syllDict={};
   var lines = data.toString().split("\n"),
       lineSplit
   lines.forEach(function(line){  
	    lineSplit = line.split("  "); 
	    if(lineSplit[1]!=undefined){ 
		    var phonemes=lineSplit[1].split(" ");
		    var word=lineSplit[0];
		    var syllCount=0; // 
		    for(var i=0;i<phonemes.length;i++){
			    if(phonemes[i].match(/\d/)){
			    		syllCount++;
			    }
			 }
		}
	    syllDict[word]=syllCount;
  }); 
  return syllDict; 
}

/*Transforms training text to uppercase and removes extraneous characters*/
function processText(file){
	return fs.readFileSync(file).toString().replace(/[^a-zA-Z!' ]+/g, "").toUpperCase();
}

/*Generates a frequency table for a text, mapping each word to an object that
maps following words to their counts
E.g. "The dog walked, the dog sat. ->
{"the":{"dog":2},"dog":{"walked":1,"sat":1},"sat":{},"walked":{"the":1}}*/
function generateFrequencyTable(text){
	freqTable={};
	var arr=text.split(" ");
	for(var i=0;i<(arr.length-1);i++){
	  if(freqTable[arr[i]]===undefined){
	    var nextWord=arr[i+1];
	    freqTable[arr[i]]={};
	  }
	  if(freqTable[arr[i]][arr[i+1]]===undefined){
	    freqTable[arr[i]][arr[i+1]]=1;
	  }
	  else{
	    freqTable[arr[i]][arr[i+1]]+=1;
	  }
	}
	return freqTable;
}
/*Generates chains of words, with probabilities based on the frequency table,
until the correct syllable account is achieved*/
function getNextLine(syllables,keys,freqTable,syllDict,wordsUsed){
	while(true){
		syllablesLeft=syllables;
		str="";
		var firstIndex=getRandomIntInclusive(0,keys.length-1)
		var current=keys[firstIndex];	
		while(syllablesLeft>0){
			var nextWord=selectNextWord(current,freqTable,wordsUsed,keys);
			if(syllDict[nextWord]===undefined){ 
				var nextIndex=getRandomIntInclusive(0,keys.length-1)
				nextWord=keys[nextIndex];
			}
			var syllablesUsed=syllDict[nextWord];
			str=str+nextWord+" "
			syllablesLeft-=syllablesUsed;
			current=nextWord;
			if(syllablesLeft==0&&checkEnd(str)){
				return str;
			}
		}
	}
}

/*Used by both Markov chain approaches; uses the frequency table to generate probabilities 
for a word to follow the current word;
selects a new word based on these probabilities*/
function selectNextWord(current,freqTable,wordsUsed,keys){
	if(freqTable[current]===undefined){
		console.log("DEBUG",current); //DO SOMETHING
	} //DEBUGGING
	var successors=Object.keys(freqTable[current]);
	var probRanges=[];
	var sum=0;
	for(var i=0;i<successors.length;i++){
		sum+=freqTable[current][successors[i]];
	}
	for(var i=0;i<successors.length;i++){
		if(i==0){
			probRanges.push(freqTable[current][successors[i]]/sum);
		}
		else{
			probRanges.push(probRanges[i-1]+(freqTable[current][successors[i]]/sum));
		}
	}
	var randNum=Math.random();
	var upperLim=probRanges[0];
	var counter=0;
	while(randNum>upperLim){
		if(randNum<probRanges[counter+1]){
			counter++;
			upperLim=probRanges[counter];
		}
		else{
			break;
		}
	}
	var nextWord=successors[counter];
	if(wordsUsed[nextWord]==true){ //Helps avoid overusing words
		if(Math.random()>.25){
			if(successors.length!=1){
				var newIndex=getRandomIntInclusive(0,successors.length-1)
				return successors[newIndex];
			}
		}
	}
	return nextWord;
}

/*Used by both Markov chain methods to prevent prepositions etc. from being 
the last word in a haiku*/
function checkEnd(str){
	var arr=str.split(" ");
	var forbidden=["THE","A","OF","ON","BY","FROM","FOR","AND","OR","YET","TO","MY","SHE","WITH","ITS","INTO","BUT","IS"];
	for(var i=0;i<forbidden.length;i++){
		if(arr[arr.length-2]==forbidden[i]){
			//console.log("caught",str);
			return false;
		}
	}
	return true;
}

//MARKOV CHAIN 2

/*Designed specifically to train on other haikus;
uses word chains to build haiku backwards from 
the last word*/
function haikuMarkovNew(structure,text){
	var syllDict=formatData2(cmudictFile);
	var text=processTextNew(text);
	var info=generateFrequencyTableNew(text);
	var lastWords=info[0];
	var freqTable=info[1];
	var keys=Object.keys(freqTable);
	var wordsUsed={};
	var str="";
	var index=getRandomIntInclusive(0,lastWords.length-1);
	var lastWord=lastWords[index];
	var seed=null;
	for(var i=structure.length-1;i>=0;i--){
		var nextLine=getNextLineNew(structure[i],keys,freqTable,syllDict,wordsUsed,lastWord,seed);
		var arr=nextLine.split(" ");
		for(var j=0;j<arr.length;j++){
			wordsUsed[arr[j]]=true;
		}
		str=nextLine+"\n"+str;
		seed=nextLine.split(" ")[0];
		if(seed==undefined){
			seed=lastWords[getRandomIntInclusive(0,lastWords.length-1)];
		}
	}
	console.log(str);
	
}
/*Returns a frequency table tracking mapping a word to the words that appear BEFORE it and their counts;
also returns a list of appropriate last words in the haiku from the training text*/
function generateFrequencyTableNew(text){
	freqTable={};
	var arr=text.split("\n\n");
	var lastWords=[];
	for(var i=0;i<(arr.length-1);i++){
		//COLLECT LAST WORD
		var haiku=arr[i].split(" ");
		var lastWord=haiku[haiku.length-1];
		var index=haiku.length-1;
		//console.log(index);
		var changed=false;
		while(lastWord==""&&index>0){
			lastWord=haiku[index];
			index--;
			changed=true;
		}
		lastWords.push(lastWord);
		//GENERATE BACKWARDS FREQUENCY TABLE
		var startIndex=index;
		if(changed==true){
			startIndex++;
		}
		var chainBack=[];
		for(var j=startIndex;j>=0;j--){
			var word=haiku[j];
			if(word!=""){
				var words=word.split('\n');
				for(var k=words.length-1;k>=0;k--){
					if(words[k]!=""){
						chainBack.push(words[k]);
					}
				}
			}
		}	
		for(var j=0;j<chainBack.length;j++){
			if(freqTable[chainBack[j]]===undefined){
	   			freqTable[chainBack[j]]={};
	   		}
	   		if(freqTable[chainBack[j]][chainBack[j+1]]===undefined){
	   			freqTable[chainBack[j]][chainBack[j+1]]=1;
	  		}
	  		else{
	   			freqTable[chainBack[j]][chainBack[j+1]]+=1;		
	  		}
	  	}
	}
    var toReturn=[lastWords,freqTable];
	return toReturn;
}
/*Converts the text to uppercase and strips most characters*/
function processTextNew(file){
	return fs.readFileSync(file).toString().replace(/[^a-zA-Z!' \n]+/g,"").toUpperCase();
}

/*Generates chains of words, with probabilities based on the frequency table,
until the correct syllable account is achieved*/
function getNextLineNew(syllables,keys,freqTable,syllDict,wordsUsed,lastWord,seed){
	var calls=0;
	while(true){
		if(calls>50){ //Lazy way of escaping bugs - should neevr actually get called
			return getNextLineNew(syllables,keys,freqTable,syllDict,wordsUsed,keys[getRandomIntInclusive(0,keys.length-1)],null);
		}
		calls++;
		var current=lastWord;
		if(seed!=null){
			current=selectNextWord(seed,freqTable,wordsUsed,keys);
		}
		while((current==undefined)||(syllDict[current]==undefined)){
			current=keys[getRandomIntInclusive(0,keys.length-1)];
		}
		var syllablesUsed=syllDict[current];
		var syllablesLeft=syllables-syllablesUsed;
		while(syllablesLeft<0){
			current=keys[getRandomIntInclusive(0,keys.length-1)];
			while(syllDict[current]==undefined){
				current=keys[getRandomIntInclusive(0,keys.length-1)];
			}
			syllablesUsed=syllDict[current];
			syllablesLeft=syllables-syllablesUsed;
		}
		var str=current;
		if(syllablesLeft==0){
			return str;
		}
		var attempts=0;
		var attemptsAllowed=syllables*5;
		while(syllablesLeft>0){
			var nextWord=selectNextWord(current,freqTable,wordsUsed,keys);
			while(syllDict[nextWord]==undefined){ 
				nextWord=keys[getRandomIntInclusive(0,keys.length-1)];
			}
			if(attempts>=attemptsAllowed){
				str="";
				syllablesLeft=syllables;
				nextWord=keys[getRandomIntInclusive(0,keys.length-1)];
				while(syllDict[nextWord]==undefined){ 
					nextWord=keys[getRandomIntInclusive(0,keys.length-1)];
				}
				attempts=0;
			}
			syllablesUsed=syllDict[nextWord];
			str=nextWord+" "+str;
			syllablesLeft-=syllablesUsed;
			current=nextWord;
			attempts++;
			if(syllablesLeft==0&&checkEnd(str)){
				return str;
			}
			if(syllablesLeft<=0){
				str="";
				syllablesLeft=syllables;
				current=keys[getRandomIntInclusive(0,keys.length-1)];
				while(syllDict[current]==undefined){
					current=keys[getRandomIntInclusive(0,keys.length-1)];
				}
				attempts=0;
			}
		}
	}
}

function createHaiku(structure){
	console.log("\n[basic method]");
	haikuBasic(structure);
	console.log("[markov chain 1]\n");
    haikuMarkov(structure,'./wasteland.txt');
    console.log("[markov chain 2]\n");
    for(var i=0;i<3;i++){
    	haikuMarkovNew(structure,'./basho.txt');
    }
}


module.exports = {
  		createHaiku: createHaiku,
	};
