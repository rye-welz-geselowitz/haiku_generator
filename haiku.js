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


function createHaiku(structure){
	var syllablesArr=formatData(cmudictFile);
	//console.log(structure);
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
	//console.log(complexStructure);
	var poem="\n";
	for(var i=0;i<complexStructure.length;i++){
		for(var j=0;j<complexStructure[i].length;j++){
			var numSylls=complexStructure[i][j];
			var wordIndex=getRandomIntInclusive(0,syllablesArr[numSylls].length);
			var word=syllablesArr[numSylls][wordIndex].replace(/[^a-zA-Z! ]+/g, "");
			poem=poem+word+" "
		}
		poem+="\n";
	}
	console.log(poem);
    //console.log("this should log a haiku with the structure " + structure);
}


module.exports = {
  		createHaiku: createHaiku,
	};
