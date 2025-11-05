// === HTML要素をあらかじめ取得 ===
const uploader = document.getElementById('csv-uploader');
const errorMessageDiv = document.getElementById('error-message');
const resultContainer = document.getElementById('result-container');
const odaiNav = document.getElementById('odai-nav');
const resultArea = document.getElementById('result-area');

// ★グローバル変数★ 解析したデータを保持する
let allOdaiData = {};

// === 1. すべての始まり (イベントリスナー) ===
uploader.addEventListener('change', handleFile);


// === 2. handleFile 関数 (ファイル受付・読み込み) ===
function handleFile(event) {
    showError(""); 
    resultContainer.style.display = 'none'; // 結果を隠す
    
    const file = event.target.files[0];
    if (!file) return; 
    if (!file.name.endsWith('.csv')) {
        showError("CSVファイルを選択してください。");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        try {
            // ステップ3: CSVを解析
            allOdaiData = parseCSV(csvText); // 結果をグローバル変数に保存
            
            console.log("CSVの解析が完了しました:", allOdaiData);

            // ★ステップ4: ページ表示のメイン関数を呼び出す
            renderPage();

        } catch (error) {
            console.error("CSV解析中にエラーが発生:", error);
            showError("CSVファイルの形式が正しくありません。");
        }
    };
    reader.onerror = function() {
        showError("ファイルの読み込みに失敗しました。");
    };
    reader.readAsText(file, 'Shift_JIS'); 
}


// === 3. parseCSV 関数 (CSVの解析とデータ整理) ===
// (前回のステップで完成済み・変更なし)
function parseCSV(csvText) {
    const odaiData = {}; 
    const lines = csvText.split('\n'); 

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") continue; 

        const columns = line.split(',');
        if (columns.length < 8) continue;

        const odaiBango     = columns[1]; 
        const shutsudaisha  = columns[2]; 
        const odaiTitle     = columns[3]; 
        const kaitousha     = columns[5]; 
        const kaitou        = columns[6]; 
        const tokuhyousuu   = parseInt(columns[7], 10); 

        if (!odaiBango) continue;

        const uchiwakeParts = []; 
        for (let j = 9; j < columns.length; j += 2) {
            const voterName = columns[j] ? columns[j].trim() : ""; 
            const voterVotes = columns[j + 1] ? columns[j + 1].trim() : ""; 

            if (voterName && voterVotes) {
                const cleanName = voterName.substring(voterName.indexOf(' ') + 1);
                uchiwakeParts.push(`${cleanName}(${voterVotes})`);
            } else {
                break; 
            }
        }
        const uchiwakeText = uchiwakeParts.join(' / ');

        if (!odaiData[odaiBango]) {
            odaiData[odaiBango] = {
                odaiTitle: odaiTitle,
                shutsudaisha: shutsudaisha,
                answers: [] 
            };
        }

        odaiData[odaiBango].answers.push({
            kaitou: kaitou,
            kaitousha: kaitousha,
            votes: tokuhyousuu, 
            uchiwake: uchiwakeText 
        });
    }

    for (const bango in odaiData) {
        odaiData[bango].answers.sort((a, b) => b.votes - a.votes);
    }

    return odaiData;
}


// === 4. renderPage 関数 (初回ページ表示) ===
/**
 * 解析データ (allOdaiData) をもとに、ページ全体を初期表示する
 */
function renderPage() {
    // 0. 結果コンテナを表示する
    resultContainer.style.display = 'block';

    // 1. お題ナビゲーションを作る (ステップ5)
    renderNavigation();

    // 2. 「お題1」を初期表示する (ステップ6)
    //    `Object.keys(allOdaiData)` は ["1", "2", "3"] のような配列を返す
    //    その [0] 番目、つまり最初のお題番号 ("1") を渡す
    const firstOdaiBango = Object.keys(allOdaiData)[0];
    if (firstOdaiBango) {
        renderResultArea(firstOdaiBango);
    } else {
        showError("CSVデータにお題が見つかりませんでした。");
    }
}


// === 5. renderNavigation 関数 (お題ナビゲーションの表示) ===
/**
 * ページ上部のお題リンク (1, 2, 3...) を生成する
 */
function renderNavigation() {
    odaiNav.innerHTML = ''; // 既存のリンクをクリア

    // allOdaiData のキー（"1", "2" など）の数だけループ
    for (const bango in allOdaiData) {
        const link = document.createElement('a'); // <a> タグを作成
        link.href = "#"; // ページ遷移しないように # を指定
        link.textContent = bango; // リンクの文字を "1" や "2" にする
        link.style.margin = '0 5px'; // 見た目を整える (CSSでやるのが望ましい)

        // ★重要★ リンクがクリックされた時の動作を予約
        link.addEventListener('click', function(event) {
            event.preventDefault(); // ページがリロードするのを防ぐ
            // ステップ6 の関数を、クリックされたお題番号で呼び出す
            renderResultArea(bango); 
        });

        odaiNav.appendChild(link); // 組み立てたリンクを <nav> タグに追加
    }
}


// === 6. renderResultArea 関数 (結果詳細の表示) ===
/**
 * 指定されたお題番号の結果を、HTMLとして resultArea に表示する
 * @param {string} bango - 表示したいお題番号 (例: "1")
 */
function renderResultArea(bango) {
    // 表示するお題のデータを取得
    const odai = allOdaiData[bango];
    if (!odai) return; // データがなければ何もしない

    // ここでHTMLを組み立てる (文字列として)
    // 参照画像 (2枚目) のレイアウトを参考にしています
    
    let htmlContent = '';

    // 1. お題タイトルと出題者
    htmlContent += `<h3>お題 (番号: ${bango})</h3>`;
    htmlContent += `<p style="font-size: 1.2em; font-weight: bold;">${odai.odaiTitle}</p>`;
    htmlContent += `<p>出題者: ${odai.shutsudaisha}</p>`;
    htmlContent += `<hr>`; // 区切り線

    // 2. 回答一覧 (ソート済み)
    odai.answers.forEach((answer, index) => {
        const rank = index + 1; // 順位 (0から始まるのを1始まりにする)

        htmlContent += `<div class="answer-item" style="margin-bottom: 20px;">`;
        
        // 順位と回答
        htmlContent += `<strong>${rank}位</strong> (${answer.votes}票)<br>`;
        htmlContent += `<p style="font-size: 1.1em; margin: 5px 0;">${answer.kaitou}</p>`;
        
        // 回答者
        htmlContent += `<p style="font-size: 0.9em; color: #555;">回答者: ${answer.kaitousha}</p>`;
        
        // 投票内訳 (もしあれば)
        if (answer.uchiwake) {
            htmlContent += `<p style="font-size: 0.8em; color: #777;">投票内訳: ${answer.uchiwake}</p>`;
        }

        htmlContent += `</div>`;
    });

    // 組み立てたHTMLを <div id="result-area"> に一括で挿入
    resultArea.innerHTML = htmlContent;
}


// === 7. showError 関数 (エラー表示) ===
function showError(message) {
    errorMessageDiv.textContent = message;
}