"use strict";

class RSA {

    // metodo calcolo MCD
    gcd(a,b) {
        while(b){
            [a,b] = [b,a%b];
        }
        return a;
    }

    // metodo calcolo inverso mod n
    modInverse(e, phi) {
        let [m0, y, x] = [phi, 0n, 1n]; // inizializzo m0, y, x
        if (phi === 1n) return 0n; // se phi è 1, l'inverso mod non esiste
        while (e > 1n) { // finché e è maggiore di 1
            const q = e/m0; // calcolo quoziente
            [e, m0] = [m0, e % m0]; // aggiorno e e m0
            [x,y] = [y, x - q * y]; // aggiorno x e y
        }
        if (x <0n) x += phi; // se x è negativo, aggiungo phi
        return x; // ritorno l'inverso mod

    }

    // funzione per testare primalità
    isPrime(n){
        if (n <= 1n) return false; // numeri minori o uguali a 1 non sono primi
        if (n <= 3n) return true; // 2 e 3 sono primi
        if (n % 2n === 0n || n % 3n === 0n) return false; // multipli di 2 e 3 non sono primi
        for (let i = 5n; i * i <= n; i += 6n) { // controllo fino alla radice quadrata di n
            if (n % i === 0n || n % (i + 2n) === 0n) return false; // se n è divisibile per i o i+2, non è primo
        }
        return true; 
    }

    generatePrime(bits) {
        const min = 1n << (BigInt(bits) - 1n); // calcolo il minimo numero con bits
        const max = (1n << BigInt(bits)) - 1n; // calcolo il massimo numero con bits
        while(true){
            let p = BigInt(Math.floor(Math.random() * (Number(max-min) +1))) + min; // genero un numero casuale tra min e max
            if(this.isPrime(p)) return p; // se p è primo, lo ritorno
        }
    }

    generateKeys(bitLength = 32) {
        const p = this.generatePrime(bitLength / 2); // genero primo p
        const q = this.generatePrime(bitLength / 2); // genero primo q
        const n = p * q; // calcolo n

        // calcolo phi(n)
        const phi = (p - 1n) * (q - 1n);

        // scelgo e
        let e = 65537n; // valore comunemente usato per e

        if( e >= phi || this.gcd(e, phi) !== 1n){
            e = 17n;
        }

        // calcolo d
        const d = this.modInverse(e, phi);

        return {
            publicKey: { e: e, n: n },
            privateKey: { d: d, n: n}
        };
    }

    modPow(base, exp, mod){
        let res = 1n; // inizializzo risultato
        base = base % mod; // riduco base modulo mod
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod; // se exp è dispari, moltiplico res per base
            exp = exp >> 1n; // divido exp per 2
            base = (base * base) % mod; // aggiorno base
        }

        return res; // ritorno risultato
    }

    encrypt(message, publicKey) {
        return this.modPow(message, publicKey.e, publicKey.n); // calcolo ciphertext = message^e mod n
    }

    decrypt(ciphertext, privateKey) {
        return this.modPow(ciphertext, privateKey.d, privateKey.n); // calcolo message = ciphertext^d mod n
    }

    // cifro una stringa, lettera per lettera
    encryptString(plainText, publicKey) {
        const encryptedMessage = [];
        for(let i=0; i<plainText.length; i++){ // itero su ogni carattere della stringa
            const charCode = BigInt(plainText.charCodeAt(i)); // ottengo il codice ashii del carattere, convertito in bigint
            encryptedMessage.push(this.encrypt(charCode, publicKey)); // cifro il codice ashii e lo aggiungo all'array
        }

        return encryptedMessage;
    }

    // decifro una stringa, lettera per lettera
    decryptString(encryptedMessage, privateKey) {
        let decryptedText = '';
        for (const num of encryptedMessage) { // itero su ogni numero nell'array
            const decryptedCharCode = this.decrypt(num, privateKey); // decifro il numero
            decryptedText += String.fromCharCode(Number(decryptedCharCode)); // converto il codice ashii in carattere e lo aggiungo alla stringa
        }

        return decryptedText;
    }

}

class FrequencyAttack {

    englishLetterFrequencies = { 
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

    // calcolo distribuzione frequenza numeri cifrati
    computeCipherDistribution(encryptedArray) {
        const distribution = new Map(); // mappa per contare occorrenze
        const total = encryptedArray.length; // numero totale di elementi

        for (const num of encryptedArray) {
            distribution.set(num, (distribution.get(num) || 0) + 1); // conto occorrenze
        }
        return new Map([...distribution.entries()].sort((a, b) => b[1] - a[1])); // ordino per frequenza decrescente
    }

    // decodifico il messaggio cifrato in base alle frequenze
    decode(encryptedArray) {
        const cipherDistribution = this.computeCipherDistribution(encryptedArray); // calcolo distribuzione frequenza cifrati

        // ordino le lettere inglesi per frequenza decrescente
        const sortedEnglishLetters = Object.entries(this.englishLetterFrequencies)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        // ordino i numeri cifrati per frequenza decrescente
        const sortedCipherNumbers = Array.from(cipherDistribution.keys());

        // creo mappa di sostituzione
        const substitutionMap = new Map();
        for (let i = 0; i < sortedCipherNumbers.length && i < sortedEnglishLetters.length; i++) {
            substitutionMap.set(sortedCipherNumbers[i], sortedEnglishLetters[i]);
        }

        // decodifico il messaggio
        let decodedMessage = '';
        for (const num of encryptedArray) {
            decodedMessage += substitutionMap.get(num) || '?'; // sostituisco con '?' se non trovato
        }

        return decodedMessage;
    }

        
}

document.addEventListener('DOMContentLoaded', () => {
    // istanzio le classi
    const rsa = new RSA();
    const freqAttack = new FrequencyAttack();

    // gestisco input e output
    const textArea = document.getElementById('textToAnalyze');
    const outputArea = document.getElementById('outputText');

    let publicKey, privateKey; // variabili per chiavi

    // gestisco i bottoni
    document.getElementById('btnGenerateKeys').addEventListener('click', () => {
        // genero chiavi pubbliche e private, mostrandole a schermo
        const keys = rsa.generateKeys(32); // genero chiavi con lunghezza 32 bit
        publicKey = keys.publicKey;
        privateKey = keys.privateKey;
        document.getElementById('keys').textContent =
            `Public Key (e, n): (${publicKey.e}, ${publicKey.n})\n` +
            `Private Key (d, n): (${privateKey.d}, ${privateKey.n})`;
        
        
    });

    document.getElementById('btnEncrypt').addEventListener('click', () => {

        if (!publicKey) {
            alert("Per favore, genera prima le chiavi RSA!");
            return; // Interrompe l'esecuzione della funzione
        }

        const plainText = textArea.value; // prendo il testo da cifrare
        const encryptedMessage = rsa.encryptString(plainText, publicKey); // cifro il testo
        outputArea.value = encryptedMessage.join(', '); // mostro il messaggio cifrato

    });

    document.getElementById('btnDecrypt').addEventListener('click', () => {
        if (!privateKey) {
            alert("Per favore, genera prima le chiavi RSA!");
            return; // Interrompe l'esecuzione della funzione
        }

        const encryptedText = outputArea.value.split(',').map(num => BigInt(num.trim())); // prendo il testo cifrato e lo converto in array di bigint
        const decryptedMessage = rsa.decryptString(encryptedText, privateKey); // decifro il messaggio
        outputArea.value = decryptedMessage; // mostro il messaggio decifrato

    });

    document.getElementById('btnDecryptFreq').addEventListener('click', () => {
        const encryptedText = outputArea.value.split(',').map(num => BigInt(num.trim())); // prendo il testo cifrato e lo converto in array di bigint
        const decodedMessage = freqAttack.decode(encryptedText); // decodifico il messaggio con l'attacco di frequenza
        outputArea.value = decodedMessage; // mostro il messaggio decodificato
        
    });

});