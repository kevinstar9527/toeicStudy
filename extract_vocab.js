// Script to extract vocabulary data from index.html

// Read the index.html file
const htmlContent = fs.readFileSync('index.html', 'utf8');

// Extract the JavaScript part that contains the toeflVocabData
const scriptMatch = htmlContent.match(/const toeflVocabData = \{[\s\S]*?\};\s*\n\s*\n/);
if (!scriptMatch) {
    console.error('Could not find toeflVocabData in the HTML file');
    process.exit(1);
}

const dataString = scriptMatch[0];
console.log('Found toeflVocabData, length:', dataString.length);

// Extract just the JSON part (remove the "const toeflVocabData = " and trailing semicolon)
const jsonString = dataString.replace(/const toeflVocabData = /, '').replace(/;\s*$/, '');

try {
    const data = eval('(' + jsonString + ')');
    
    let wordId = 1;
    const allWords = [];
    
    data.courses.forEach((course, courseIndex) => {
        const courseNumber = courseIndex + 1;
        const courseName = `托业基础课程${courseNumber.toString().padStart(2, '0')}`;
        
        if (course.vocabs) {
            course.vocabs.forEach(vocab => {
                // Create a comprehensive meaning string
                let meaning = vocab.meaning;
                if (vocab.part) {
                    meaning = `${vocab.part} ${meaning}`;
                }
                if (vocab.phonetic) {
                    meaning = `${vocab.phonetic} ${meaning}`;
                }
                
                // Add example if available
                if (vocab.example) {
                    meaning += ` 例：${vocab.example}`;
                }
                
                // Add details if available
                if (vocab.details) {
                    if (vocab.details.synonyms && vocab.details.synonyms.length > 0) {
                        meaning += ` 同：${vocab.details.synonyms.join(', ')}`;
                    }
                    if (vocab.details.derivatives && vocab.details.derivatives.length > 0) {
                        meaning += ` 派：${vocab.details.derivatives.join(', ')}`;
                    }
                    if (vocab.details.collocations && vocab.details.collocations.length > 0) {
                        meaning += ` 搭：${vocab.details.collocations.join(', ')}`;
                    }
                }
                
                allWords.push({
                    id: wordId++,
                    front: vocab.word,
                    back: meaning,
                    tags: ['托业基础', courseName, '高频词汇'],
                    mastery: 0,
                    nextReview: null,
                    reviewCount: 0
                });
            });
        }
    });
    
    console.log(`Extracted ${allWords.length} words from ${data.courses.length} courses`);
    
    // Generate the new toeic-words.js content
    const newContent = `// 托业基础课程单词数据
const TOEIC_BASIC_WORDS = ${JSON.stringify(allWords, null, 4)};

// 导出函数，用于初始化数据
function getTOEICBasicWords() {
    return TOEIC_BASIC_WORDS.map(word => ({
        ...word,
        createdAt: new Date().toISOString()
    }));
}`;

    fs.writeFileSync('toeic-words-new.js', newContent);
    console.log('Successfully created toeic-words-new.js with extracted vocabulary data');
    
} catch (error) {
    console.error('Error parsing JSON data:', error);
    process.exit(1);
}