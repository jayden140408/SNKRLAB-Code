function countMatchingGrades(mathGrades, englishGrades) {
    let countA = 0;
    let countB = 0;
    let countF = 0;
    
    for (let i = 0; i < mathGrades.length; i++) {
        if (mathGrades[i] == 'A' && englishGrades[i] == 'A') {
            countA++;
        } else if (mathGrades[i] == 'B' && englishGrades[i] == 'B') {
            countB++;
        } else if (mathGrades[i] == 'F' || englishGrades[i] == 'F') {
            countF++;
        }
    }
    let mathArrayGrades    = ['A', 'B', 'F', 'C', 'A', 'F', 'B', 'D', 'A'];
    let englishArrayGrades = ['A', 'B', 'C', 'F', 'A', 'F', 'C', 'B', 'F'];
    console.log(countA); // (a)
    console.log(countB); // (b)
    console.log(countF); // (c)
}


countMatchingGrades(mathArrayGrades, englishArrayGrades);