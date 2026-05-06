const fileInput = document.getElementById("file-input");

let pdfDoc = null,
    pageNum =1;

let extractedText = "";

const scale=1.0,
    canvas=document.querySelector('#pdf-render'),
    ctx = canvas.getContext('2d');

// start quiz button
document.getElementById("start-quiz").addEventListener("click",function(){
    
    if (!pdfDoc){
        alert("PDF not uploaded");
        return;
    }
    generateQuiz();
});

// UPLOAD PDF

fileInput.addEventListener("change", function(event){
    const file = event.target.files[0];

    const reader = new FileReader();

    reader.onload = function(){
        const typedArray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedArray).promise.then(function(pdf){
            pdfDoc = pdf;
            alert("PDF uploaded Successfully.");
            // style
            pageRender(1); //call pageRender()
        });
    };
    reader.readAsArrayBuffer(file);
});

//  TEXT EXTRACTION

function extractText(){
    if(!pdfDoc){
        alert("Please upload a pdf file first.");
        return;
    }
    extractedText = "";

    let promises = [];

    for (let i = 1; i<= pdfDoc.numPages; i++){
        promises.push(
            pdfDoc.getPage(i).then(page =>{
                return page.getTextContent();
            }).then(content => {
                let pageText= content.items.map(item => item.str).join(" ");
                pageText = pageText.replace(/\s+/g, " ");  //it fix spacing
                extractedText += pageText + " ";
            })
        );
    }

    Promise.all(promises).then(() => {
        console.log("TEXT:",extractedText);
        document.getElementById("output").innerText = extractedText;
        document.getElementById("start-quiz").style.display="block";
    });
}
// Page rendering

function pageRender(num) {
    pdfDoc.getPage(num).then(function(page){

        const viewport = page.getViewport({ scale: scale});

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        page.render({
            canvasContext: ctx,
            viewport: viewport
        });
    }); 
}
      /* QUIZ PART USING NLP */

//splitting sentence
function getSentences(text){  
    return text.split(/[.?!]/);
}

//Extracting keyword
function getKeywords(sentence){
    let words = sentence.split(" ");

    return words.filter(word => word.length > 3  && /^[a-zA-Z]+$/.test(word) );
}
// Generating Quiz question

function generateQuiz(){

    console.log("Quiz started");
        //checks if text extraction is done or not

     if (!extractedText){
        alert("Text not extracted");
        return;
    }

    let sentences = getSentences(extractedText);

    let quizHTML ="";

    let count = 0; //ensures at least one question

    sentences = sentences.sort(() => Math.random() - 0.5); // to suffle questions
    for (let i=0 ; i< sentences.length && count < 5; i++){
        let sentence = sentences[i];

        if (!sentence) continue;
        sentence = sentence.trim();

        let keywords = getKeywords(sentence);

        if (keywords.length===0) continue;

        let answer =  keywords[Math.floor(Math.random() * keywords.length)];
        let question = sentence.split(". ")[0]; 
        question = question.replace(answer, "___");

        let options = generateOptions(answer);

        quizHTML += `<div class="question">
        <p><b>Q${count+1}: </b> ${question}</p>
       
        `;
        options.forEach(opt =>{
            quizHTML += `
            <button onclick = "checkAnswer('${opt}', '${answer}', this)">
            ${opt}
            </button><br>
            `;
        });

        quizHTML += `</div><hr>`;
        count++;
    }

    document.getElementById("quiz-container").innerHTML = quizHTML;
        console.log(extractedText);
}
// For Options
function generateOptions(correctAnswer){
    let options= [correctAnswer];

    let allWords = extractedText.split(" ");

    while (options.length < 4){
        let randomWord = allWords[Math.floor(Math.random() * allWords.length)];

        randomWord = randomWord.replace(/[^a-zA-Z]/g, ""); //for clean word
        
        if(randomWord && !options.includes(randomWord)){
            options.push(randomWord);
        }
    }
  return options.sort(() => Math.random() - 0.5); //to shuffle answers and options
}

// to check correct answer
function checkAnswer(selected, correct, btn){
    const buttons = btn.parentElement.querySelectorAll("button");

    buttons.forEach(b =>{
        if (b.innerText===correct){
            b.style.background="green";
        }
        if (b===btn && selected !== correct){
            b.style.background= "red";
        }
    });
}
