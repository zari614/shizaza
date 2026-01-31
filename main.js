console.log("main.js loaded");
console.log("phina typeof:", typeof phina);

function setDebug(text) {
  var el = document.getElementById("debug-overlay");
  if (el) el.textContent = "debug: " + text;
}

setDebug("main.js start");
if (typeof phina === "undefined") {
  setDebug("phina.js が読み込めていません");
  throw new Error("phina missing");
}

phina.globalize();
setDebug("phina globalized");

var SCREEN_WIDTH = 720;
var SCREEN_HEIGHT = 1280;
var GAME_TIME = 30; // seconds
var SHOW_NAME = true; // set false after images are ready
var USE_IMAGES = true; // set true after images are ready

var QUESTIONS = [
  { id: "shizari", name: "シザリガー", isShizari: true, img: "assets/img/shizari.png" },
  { id: "heigani", name: "ヘイガニ", isShizari: false, img: "assets/img/heigani.png" },
  { id: "krabb", name: "クラブ", isShizari: false, img: "assets/img/krabb.png" },
  { id: "kingler", name: "キングラー", isShizari: false, img: "assets/img/kingler.png" },
  { id: "makennkani", name: "マケンカニ", isShizari: false, img: "assets/img/makennkani.png" },
  { id: "kekenkani", name: "ケケンカニ", isShizari: false, img: "assets/img/kekenkani.png" }
];

function buildAssets() {
  if (!USE_IMAGES) return {};
  var images = {};
  QUESTIONS.forEach(function(q) { images[q.id] = q.img; });
  return { image: images };
}

phina.define("TitleScene", {
  superClass: "DisplayScene",
  init: function() {
    this.superInit({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
    this.backgroundColor = "#10232a";
    setDebug("TitleScene init");

    Label({
      text: "シザリガー？\nそれともカニ？",
      fill: "#ffffff",
      fontSize: 56,
      align: "center",
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(4));

    Label({
      text: "出てきたポケモンが\nシザリガーかどうか判断！",
      fill: "#b9d4db",
      fontSize: 28,
      align: "center",
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(7));

    Button({
      text: "START",
      width: 260,
      height: 90,
      fontSize: 32,
      fontColor: "#0e1a1f",
      fill: "#f7d154",
      stroke: "#fbe39a",
      strokeWidth: 4,
      cornerRadius: 12,
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(11))
      .onpush = function() {
        this.app.replaceScene(GameScene());
      }.bind(this);

    Label({
      text: "30秒で何問正解できる？",
      fill: "#86a6b1",
      fontSize: 22,
      align: "center",
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(13));
  },
});

phina.define("GameScene", {
  superClass: "DisplayScene",
  init: function() {
    this.superInit({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
    this.backgroundColor = "#0b1418";

    this.score = 0;
    this.correct = 0;
    this.asked = 0;
    this.timeLeft = GAME_TIME;
    this.currentQuestion = null;

    this.scoreLabel = Label({
      text: "SCORE 0",
      fill: "#ffffff",
      fontSize: 28,
      align: "left",
    }).addChildTo(this).setPosition(this.gridX.span(2.5), this.gridY.span(1.5));

    this.timeLabel = Label({
      text: "TIME 30",
      fill: "#ffffff",
      fontSize: 28,
      align: "right",
    }).addChildTo(this).setPosition(this.gridX.span(13.5), this.gridY.span(1.5));

    this.card = DisplayElement().addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(6.5));

    this.cardFrame = RectangleShape({
      width: 420,
      height: 420,
      fill: "#14303a",
      stroke: "#2b5564",
      strokeWidth: 6,
      cornerRadius: 20,
    }).addChildTo(this.card);

    this.placeholderLabel = Label({
      text: "画像準備中",
      fill: "#7fb1be",
      fontSize: 28,
      align: "center",
    }).addChildTo(this.card);

    this.nameLabel = Label({
      text: "",
      fill: "#e7f3f6",
      fontSize: 32,
      align: "center",
      y: 150,
    }).addChildTo(this.card);

    this.sprite = null;

    this.feedback = Label({
      text: "",
      fill: "#ffffff",
      fontSize: 36,
      align: "center",
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(9));

    this.shizariButton = Button({
      text: "シザリガー",
      width: 260,
      height: 90,
      fontSize: 28,
      fontColor: "#0e1a1f",
      fill: "#f07b7b",
      stroke: "#f5b0b0",
      strokeWidth: 4,
      cornerRadius: 12,
    }).addChildTo(this).setPosition(this.gridX.span(4), this.gridY.span(11));

    this.otherButton = Button({
      text: "ほかのカニ",
      width: 260,
      height: 90,
      fontSize: 28,
      fontColor: "#0e1a1f",
      fill: "#6fd4a6",
      stroke: "#b2ead1",
      strokeWidth: 4,
      cornerRadius: 12,
    }).addChildTo(this).setPosition(this.gridX.span(12), this.gridY.span(11));

    this.shizariButton.onpush = function() {
      this.judge(true);
    }.bind(this);

    this.otherButton.onpush = function() {
      this.judge(false);
    }.bind(this);

    this.nextQuestion();
  },

  nextQuestion: function() {
    this.currentQuestion = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    this.asked += 1;

    if (USE_IMAGES) {
      this.placeholderLabel.visible = false;
      this.nameLabel.visible = SHOW_NAME;
      if (this.sprite) this.sprite.remove();
      this.sprite = Sprite(this.currentQuestion.id).addChildTo(this.card);
      this.sprite.setSize(360, 360);
      this.sprite.setPosition(0, 0);
    } else {
      this.placeholderLabel.visible = true;
      this.nameLabel.visible = true;
      this.placeholderLabel.text = "画像準備中";
    }
    this.nameLabel.text = SHOW_NAME ? this.currentQuestion.name : "";
    this.feedback.text = "";
  },

  judge: function(answerIsShizari) {
    if (!this.currentQuestion) return;

    var isCorrect = (answerIsShizari === this.currentQuestion.isShizari);
    if (isCorrect) {
      this.score += 1;
      this.correct += 1;
      this.feedback.text = "正解！";
      this.feedback.fill = "#f7d154";
    } else {
      this.score -= 1;
      this.feedback.text = "不正解";
      this.feedback.fill = "#7fb1be";
    }

    this.scoreLabel.text = "SCORE " + this.score;

    this.nextQuestion();
  },

  update: function(app) {
    this.timeLeft -= app.deltaTime / 1000;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.app.replaceScene(ResultScene({ score: this.score, correct: this.correct, total: this.asked }));
      return;
    }

    this.timeLabel.text = "TIME " + Math.ceil(this.timeLeft);
  },
});

phina.define("ResultScene", {
  superClass: "DisplayScene",
  init: function(params) {
    this.superInit({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
    this.backgroundColor = "#10232a";

    var score = params.score || 0;
    var correct = params.correct || 0;
    var total = params.total || 0;

    Label({
      text: "結果",
      fill: "#ffffff",
      fontSize: 56,
      align: "center",
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(4));

    Label({
      text: "SCORE " + score,
      fill: "#f7d154",
      fontSize: 42,
      align: "center",
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(7));

    Label({
      text: "正解数: " + correct + " / " + total,
      fill: "#b9d4db",
      fontSize: 28,
      align: "center",
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(9));

    Button({
      text: "もう一回",
      width: 260,
      height: 90,
      fontSize: 28,
      fontColor: "#0e1a1f",
      fill: "#f7d154",
      stroke: "#fbe39a",
      strokeWidth: 4,
      cornerRadius: 12,
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(12))
      .onpush = function() {
        this.app.replaceScene(TitleScene());
      }.bind(this);
  },
});

phina.main(function() {
  var app = GameApp({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    fit: true,
    domElement: document.getElementById("phina-canvas"),
    assets: buildAssets(),
    scenes: [
      { label: "title", className: "TitleScene" },
      { label: "game", className: "GameScene" },
      { label: "result", className: "ResultScene" },
    ],
  });

  setDebug("app created");
  app.replaceScene(TitleScene());
  app.run();
});



