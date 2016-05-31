var fs = require("fs");
var cmudictFile = readCmudictFile('./cmudict.txt');

function readCmudictFile(file){
  return fs.readFileSync(file).toString();
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatData(data){ 
   var syllablesArr=[];   
   var lines = data.toString().split("\n"),
       lineSplit
   lines.forEach(function(line){  
    lineSplit = line.split("  ");    
    //console.log("The word " + lineSplit[0] + " has this phoneme    layout: " + lineSplit[1]); 
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
	    //console.log(word,syllCount);
	}
  }); 
  return syllablesArr;  
}

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
  //console.log(syllDict);
  return syllDict; 
}

/*
function getSyllDict(syllablesArr){
	var syllDict={};
	for(var i=0;i<syllablesArr.length;i++){
		//console.log("working1");
		if(syllablesArr[i]!=undefined){
			//console.log("working2");
			for(var j=0;j<syllablesArr[i].length;j++){
				//console.log("working3");
				syllDict[syllablesArr[i][j]]=i;
			}
		}
	}
	return syllDict;
}
*/
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

function processText(file){
	return fs.readFileSync(file).toString().replace(/[^a-zA-Z!' ]+/g, "").toUpperCase();
}

function haikuMarkov(structure){
	var syllDict=formatData2(cmudictFile);
	var text=processText('./basho.txt');
	//console.log(text);
	var freqTable=generateFrequencyTable(text);
	var keys=Object.keys(freqTable);
	//console.log("about to generate");
	var wordsUsed={};
	var str="";
	for(var i=0;i<structure.length;i++){
		var nextLine=getNextLine(structure[i],keys,freqTable,syllDict,wordsUsed);
		var arr=nextLine.split(" ");
		for(var j=0;j<arr.length;j++){
			wordsUsed[arr[j]]=true;
		}
		str=str+nextLine+"\n";
		//console.log(wordsUsed);
	}
	console.log(str);
	

}

function getNextLine(syllables,keys,freqTable,syllDict,wordsUsed){
	//var firstIndex=getRandomIntInclusive(0,keys.length-1)
	//var current=keys[firstIndex];	
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

function checkEnd(str){
	var arr=str.split(" ");
	var forbidden=["THE","A","OF","ON","BY","FROM","FOR","AND","OR","YET","TO","MY","SHE","WITH","ITS","INTO","BUT"];
	for(var i=0;i<forbidden.length;i++){
		if(arr[arr.length-2]==forbidden[i]){
			//console.log("caught",str);
			return false;
		}
	}
	return true;
}

function selectNextWord(current,freqTable,wordsUsed,keys){
	if(freqTable[current]===undefined){
		console.log(current);
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
	if(wordsUsed[nextWord]==true){
		//console.log("repeat");
		if(Math.random()>.25){
			if(successors.length!=1){
				//console.log("1");
				var newIndex=getRandomIntInclusive(0,successors.length-1)
				return successors[newIndex];
			}
			//console.log("2");
			//var newIndex=getRandomIntInclusive(0,successors.length-1)
			//return successors[newIndex];

		}
	}
	return nextWord;
}


function createHaiku(structure){
	var syllablesArr=formatData(cmudictFile);
	var complexStructure=[];
	for(var i=0;i<structure.length;i++){
		var availableSylls=structure[i];
		var lineStructure=[];
		while(availableSylls>0){
			var syllsInWord=getRandomIntInclusive(1,availableSylls);
			availableSylls-=syllsInWord;
			lineStructure.push(syllsInWord);
		}
		complexStructure.push(lineStructure);
	}
	var poem="\n";
	for(var i=0;i<complexStructure.length;i++){
		for(var j=0;j<complexStructure[i].length;j++){
			var numSylls=complexStructure[i][j];
			var wordIndex=getRandomIntInclusive(0,syllablesArr[numSylls].length);
			var word=syllablesArr[numSylls][wordIndex].replace(/[^a-zA-Z!']+/g, ""); //undefined error
			poem=poem+word+" "
		}
		poem+="\n";
	}
	console.log("\n[basic method]");
	console.log(poem);
	console.log("[extra credit]\n");
    haikuMarkov(structure);
}


module.exports = {
  		createHaiku: createHaiku,
	};
