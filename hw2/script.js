"use strict";

class TextAnalyzer {

    lettersDistributionRelative(text){
        const absoluteDist = this.lettersDistributionAbsolute(text);
        const totalLetters = Array.from(absoluteDist.values()).reduce((a, b) => a + b, 0);
        const relativeDist = new Map();

        absoluteDist.forEach((value, key) => {
            relativeDist.set(key, (value / totalLetters * 100).toFixed(2));
        });

        return relativeDist;
    }

    lettersDistributionAbsolute(text){
        
        // normalize the text to lowercase
        text = text.toLowerCase();

        // create a frequency map
        const frequencyMap = new Map();

        for (const char of text){
            if (char >= 'a' && char <= 'z'){
                frequencyMap.set(char, (frequencyMap.get(char) || 0) + 1);
            }      
        }

        // sort the frequency map by value
        const sortedFreqMap = new Map([...frequencyMap.entries()].sort((a, b) => b[1] - a[1]));

        return sortedFreqMap;
    }

}

class CeaserCipher {

    letters="abcdefghijklmnopqrstuvwxyz";

    encrypt(text, shift){
        const alphSize = 26;
        // Normalize the shift value
        shift = shift % alphSize;
        // save the encrypted text
        let encryptedText = "";

        // split the text into characters
        for (const char of text){
            // depending on ascii value, we can determine if it's upper or lower case
            if( char >= 'A' && char <= 'Z'){
                // Encrypt uppercase letters
                let code = char.charCodeAt(0);
                code = ((code - 65 + shift) % alphSize) + 65;
                encryptedText += String.fromCharCode(code);
            } else if (char >= 'a' && char <= 'z'){
                // Encrypt lowercase letters
                let code = char.charCodeAt(0);
                code = ((code - 97 + shift) % alphSize) + 97;
                encryptedText += String.fromCharCode(code);
            } else {
                // non-alph characters remain unchanged
                encryptedText += char;
            }
        }

        return encryptedText;
        
    }

    // source: https://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
    englishLetterFrequencies = { // Renamed 'letters' to 'englishLetterFrequencies' for clarity and to avoid conflict with 'letters' property.
        'e': 12.02,
        't': 9.10,
        'a': 8.12,
        'o': 7.68,
        'i': 7.31,
        'n': 6.95,
        's': 6.28,
        'r': 6.02,
        'h': 5.92,
        'd': 4.32,
        'l': 3.98,
        'u': 2.88,
        'c': 2.71,
        'm': 2.61,
        'f': 2.30,
        'y': 2.11,
        'w': 2.09,
        'g': 2.03,
        'p': 1.82,
        'b': 1.49,
        'v': 1.11,
        'k': 0.69,
        'x': 0.17,
        'q': 0.11,
        'j': 0.10,
        'z': 0.07
    }


    decryptBruteForce(text){
        // i have to try all possible combinations

        const possible_decryptions = [];
        for(let shift=1; shift<26; shift++){
            possible_decryptions.push(this.encrypt(text, 26 - shift));
        }

        return possible_decryptions;
        

    }

    decryptFromDistribution(text){

        // my idea is based on this source: https://www.youtube.com/watch?v=3en7PBeS_kA
        // basically we compute the distribution, we identify the most frequent letter in the text
        // and assume it corresponds to 'e', the most frequent letter in English
        // then we can compute the shift with shift = (most_freq_letter - 'e') % 26
        // and we can decrypt the text with that shift, using the encryption function with 26 - shift

        // compute the frequency distribution of letters in the text
        const textAnalyzer = new TextAnalyzer();
        const distribution = textAnalyzer.lettersDistributionAbsolute(text);

        // get the most frequent letter in the text
        const mostFrequentLetter = distribution.keys().next().value;

        const most_freq = ['e', 't', 'a', 'o', 'i'];
        const possibilities = [];

        for(let i=0; i<5; i++){
            const assumedShift = (mostFrequentLetter.charCodeAt(0) - most_freq[i].charCodeAt(0)) % 26;
            possibilities.push(this.encrypt(text, 26 - assumedShift));
        }

        return possibilities;

        /*
        // compute the shift assuming the most frequent letter corresponds to 'e'
        const assumedShift = (mostFrequentLetter.charCodeAt(0) - 'e'.charCodeAt(0)) % 26;

        // decrypt the text using the computed shift
        return this.encrypt(text, 26 - assumedShift);
        */
        
    }

}


document.addEventListener("DOMContentLoaded", () => {
    // Take inputs from the html form
    const textAnalyzer = new TextAnalyzer();
    const ceaserCipher = new CeaserCipher();

    const inputText = document.getElementById("textToAnalyze");
    const outputText = document.getElementById("outputText");
    const distributionOutput = document.getElementById("distributionOutput");

    // canvas
    const canvas = document.getElementById("histogramCanvas");
    const ctx = canvas.getContext('2d');

    document.getElementById("btnAnalyze").addEventListener("click", () => {
        distributionOutput.innerHTML = "";
        const distribution = textAnalyzer.lettersDistributionAbsolute(inputText.value);
        let output = "Absolute Frequency Distribution:<br>";
        distribution.forEach((value, key) => {
            output += `${key}: ${value}<br>`;
        });
        distributionOutput.innerHTML = output;

        const distributionRel = textAnalyzer.lettersDistributionRelative(inputText.value);
        output = "Relative Frequency Distribution:<br>";
        distributionRel.forEach((value, key) => {
            output += `${key}: ${value}%<br>`;
        });
        distributionOutput.innerHTML += output;

        drawComparisonHistogram(distributionRel, ceaserCipher.englishLetterFrequencies);


    });

    function drawComparisonHistogram(textFreq, englishFreq) {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 50;
        const chartArea = {
            x: padding,
            y: padding,
            width: canvas.width - padding * 2,
            height: canvas.height - padding * 1.5
        };

       
        const maxTextValue = Math.max(...Array.from(textFreq.values()).map(Number));
        const maxEnglishValue = Math.max(...Object.values(englishFreq));
        const maxValue = Math.ceil(Math.max(maxTextValue, maxEnglishValue === -Infinity ? 0 : maxEnglishValue)); 
        if (maxValue === 0) {

            ctx.fillStyle = '#333';
            ctx.font = "16px sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText("Nessun dato sulle frequenze per l'istogramma.", canvas.width / 2, canvas.height / 2);
            return; 
        }


        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.font = "12px sans-serif";
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';

 
        ctx.beginPath();
        ctx.moveTo(chartArea.x, chartArea.y);
        ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
        ctx.stroke();
        for (let i = 0; i <= maxValue; i += Math.ceil(maxValue / 5)) {
            const yPos = chartArea.y + chartArea.height - (i / maxValue) * chartArea.height;
            ctx.fillText(i, chartArea.x - 20, yPos);
        }
        

        ctx.beginPath();
        ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);
        ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
        ctx.stroke();


        const groupWidth = chartArea.width / 26;
        const barWidth = groupWidth * 0.4; 
        const barOffset = groupWidth * 0.1; 

        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode('a'.charCodeAt(0) + i);
            

            const groupX = chartArea.x + i * groupWidth;


            const textValue = parseFloat(textFreq.get(char)) || 0; // Ensure it's a number
            const textBarHeight = (textValue / maxValue) * chartArea.height;
            ctx.fillStyle = 'rgba(255, 99, 132, 0.7)'; // Colore rosso per il testo analizzato
            ctx.fillRect(groupX + barOffset, chartArea.y + chartArea.height - textBarHeight, barWidth, textBarHeight);


            const englishValue = englishFreq[char] || 0;
            const englishBarHeight = (englishValue / maxValue) * chartArea.height;
            ctx.fillStyle = 'rgba(54, 162, 235, 0.7)'; // Colore blu per la lingua inglese
            ctx.fillRect(groupX + barWidth + barOffset, chartArea.y + chartArea.height - englishBarHeight, barWidth, englishBarHeight);


            ctx.fillStyle = '#333';
            ctx.fillText(char.toUpperCase(), groupX + groupWidth / 2, chartArea.y + chartArea.height + 15);
        }


        ctx.fillStyle = 'rgba(255, 99, 132, 0.7)';
        ctx.fillRect(chartArea.x, chartArea.y - 30, 15, 10);
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.fillText('Analyzed Text', chartArea.x + 20, chartArea.y - 20);

        ctx.fillStyle = 'rgba(54, 162, 235, 0.7)';
        ctx.fillRect(chartArea.x + 180, chartArea.y - 30, 15, 10);
        ctx.fillStyle = '#333';
        ctx.fillText('English Language', chartArea.x + 200, chartArea.y - 20);
    }

    document.getElementById("btnEncrypt").addEventListener("click", () => {

        const shift = parseInt(document.getElementById("shiftKey").value);
        outputText.value = ceaserCipher.encrypt(inputText.value, shift);
    });

    document.getElementById("btnDecryptFreq").addEventListener("click", () => {
        const possibilities = ceaserCipher.decryptFromDistribution(inputText.value);
        let output = "Possible decryptions based on frequency analysis:\n";
        possibilities.forEach((possibility, index) => {
            output += `Possibility ${index + 1}: ${possibility}\n`;
        });
        outputText.value = output;


    });

    document.getElementById("btnDecryptBruteForce").addEventListener("click", () => {
        const possibilities = ceaserCipher.decryptBruteForce(inputText.value);
        let output = "Possible decryptions based on brute force:\n";
        possibilities.forEach((possibility, index) => {
            output += `Possibility ${index + 1}: ${possibility}\n`;
        });
        outputText.value = output;
    });
    

});