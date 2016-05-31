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

function haikuMarkov(structure){
	var text="WHAT I THOUGHT WERE FACES ARE PLUMES OF PAMPAS GRASS. YOSA BUSON THREE EXAMPLES OF THE HAIKU OF YOSA BUSON FROM THE LATE 1700S ARE OFFERED HERE: A SUMMER RIVER BEING CROSSED HOW PLEASING WITH SANDALS IN MY HANDS! LIGHT OF THE MOON MOVES WEST, FLOWERS' SHADOWS CREEP EASTWARD. IN THE MOONLIGHT, THE COLOR AND SCENT OF THE WISTERIA SEEMS FAR AWAY. KOBAYASKI ISSA HERE ARE THREE HAIKU FROM KOBAYASHI ISSA, A HAIKU MASTER POET FROM THE LATE 1700S AND EARLY 1800S: O SNAIL CLIMB MOUNT FUJI, BUT SLOWLY, SLOWLY! TRUSTING THE BUDDHA, GOOD AND BAD, I BID FAREWELL TO THE DEPARTING YEAR. EVERYTHING I TOUCH WITH TENDERNESS, ALAS, PRICKS LIKE A BRAMBLE. NATSUME SOSEKI NATSUME SOSEKI LIVED FROM 1867 - 1916. HE WAS A NOVELIST AND MASTER OF THE HAIKU. HERE ARE A COUPLE OF EXAMPLES OF HIS POEMS: OVER THE WINTRY FOREST, WINDS HOWL IN RAGE WITH NO LEAVES TO BLOW. THE CROW HAS FLOWN AWAY: SWAYING IN THE EVENING SUN, A LEAFLESS TREE. RECENT POEMS FOLLOWING ARE SOME RECENT EXAMPLES OF HAIKU POEMS: IN THE COOLNESS OF THE EMPTY SIXTH-MONTH SKY... THE CUCKOO'S CRY. - MASAOKA SHIKI WHITECAPS ON THE BAY: A BROKEN SIGNBOARD BANGING IN THE APRIL WIND. - RICHARD WRIGHT LILY: OUT OF THE WATER OUT OF ITSELF - NICK VIRGILIO GROUND SQUIRREL BALANCING ITS TOMATO ON THE GARDEN FENCE - DON EULERT AS THE WIND DOES BLOW ACROSS THE TREES, I SEE THE BUDS BLOOMING IN MAY I WALK ACROSS SAND AND FIND MYSELF BLISTERING IN THE HOT, HOT HEAT FALLING TO THE GROUND, I WATCH A LEAF SETTLE DOWN IN A BED OF BROWN. IT'S COLD—AND I WAIT FOR SOMEONE TO SHELTER ME AND TAKE ME FROM HERE. I HEAR CRACKLING CRUNCH, OF TODAY'S NEW FOUND DAY AND KNOW IT WON'T LAST FALLING TO THE GROUND, I WATCH A LEAF SETTLE DOWN IN A BED OF BROWN. A CRICKET DISTURBED THE SLEEPING CHILD; ON THE PORCH A MAN SMOKED AND SMILED. I'M TURNING OVER LOOK OUT AND GIVE ME ROOM THERE YOU CRICKET, YOU. LIMERICKS AND HAIKU THERE ARE NUMEROUS TYPES OF POEMS, FROM SILLY LIMERICKS TO THE SERIOUS DRAMATIC POETRY. LIMERICKS ARE LIKE HAIKU, IN THAT THEY ARE SHORT POEMS WITH A CERTAIN NUMBER OF LINES. FOLLOWING IS AN EXAMPLE OF A FUNNY LIMERICK BY EDWARD LEAR: THERE WAS AN OLD MAN WITH A BEARD, WHO SAID, 'IT IS JUST AS I FEARED! TWO OWLS AND A HEN, FOUR LARKS AND A WREN, HAVE ALL BUILT THEIR NESTS IN MY BEARD!'";
	var freqTable=generateFrequencyTable(text);
	var keys=Object.keys(freqTable);
	var firstIndex=getRandomIntInclusive(0,keys.length-1)
	var current=keys[firstIndex];
	var str="";
	var counter=0;
	while(counter<10){
		str=str+current+" ";
		//console.log("current",current);
		//console.log(freqTable[current]);
		current=selectNext(current,freqTable);
		counter++;
	}
	console.log(str);

}
function selectNext(current,freqTable){
	if(freqTable[current]===undefined){
		console.log(current);
	} //DEBUGGING
	var successors=Object.keys(freqTable[current]);

	//console.log("succcessors",successors);
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
		//console.log("   ",counter);
		//console.log("   ",randNum,"|",upperLim);
		if(randNum<probRanges[counter+1]){
			counter++;
			upperLim=probRanges[counter];
		}
		else{
			break;
		}
	}

	//console.log("ranges",probRanges);
	//console.log("randNum",randNum);
	//console.log("counter",counter);
	//console.log("successots",successors);
	var nextWord=successors[counter];
	//console.log(nextWord+"\n");
	return nextWord;
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
			var word=syllablesArr[numSylls][wordIndex].replace(/[^a-zA-Z!']+/g, "");
			poem=poem+word+" "
		}
		poem+="\n";
	}
	console.log(poem);
    //console.log("this should log a haiku with the structure " + structure);
    haikuMarkov();
}


module.exports = {
  		createHaiku: createHaiku,
	};
