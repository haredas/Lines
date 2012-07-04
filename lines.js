/**
 * Класс игры Lines
 * @constructor
 * @class
 * @this {Lines}
 * @author Vitaliy Shakhlin (http://jsgame.ru)
 */
function Lines() {
    // Создаем и добавляем на страницу элемент canvas на нем будет происходить все рисование
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    document.getElementById('canvas').appendChild(this.canvas);
    this.context = this.canvas.getContext('2d');
    // Добавляем события нажатия клавиш
    this.addListeners();
    // Запускаем основные функции игры
    this.restart();
}

Lines.prototype = {
    /** @type {Object} Объект HTMLCanvasElement */
    canvas: null,
    /** @type {Object} Объект на котором будем рисовать */
    context: null,
    /** @type {Number} Ширина  canvas */
    width: 700,
    /** @type {Number} Высота canvas */
    height: 500,
    /** @type {Number} Количество строк */
    rows: 9,
    /** @type {Number} Количество столбцов */
    cols: 9,
    /** @type {Number} Таймер для анимации */
    timer: null,
    /** @type {Number} Направления движения шариков */
    directionCheck : [[-1, 0], [-1,-1], [0,-1], [1,-1]],
    /** @type {Array} Доска */
    board: [],
    /** @type {Number} Размер ячейки */
    size: 50,
    /** @type {Number} Радиус шарика */
    radius: 21,
    /** @type {Number} Угол для рисования шарика */
    angle: Math.PI * 2,
    /** @type {Ball} Выбранный шарик */
    selectedBall: null,
    /** @type {Cell} Выбранная ячейка */
    selectedCell: null,
    /** @type {Array} Массив для временного хранения новых шариков */
    newColorBalls: [],
    /** @type {Array} Массив новых шариков */
    nextBalls: [],
    /**  @type {Number} Количество тактов за которые происходит анимация удаления шарика */
    countAnimateDeleteBalls: 20,
    /**  @type {Number} Количество тактов за которые происходит анимация добавления шарика */
    countAnimateAddBalls: 0,
    /** @type {Boolean} Флаг отвечающий выполняется ли какая-нибудь анимация в данный момент */
    isAnimate: false,
    /** @type {Array} Массив возможных позиций для новых шариков */
    possibleNewPositionBall: [],
    /** @type {Array} Цвета шариков */
    colorsBall: ["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff"]
};

/**
 * Обработка событий нажатия на кнопки мыши
 * @event
 * @member Lines
 */
Lines.prototype.addListeners = function() {
    var lines = this;
    var x, y;

    /** Событие при нажатии кнопки мыши */
    document.addEventListener('mousedown', function(e) {
        if (lines.isAnimate) return;
        if (e.pageX || e.pageY) {
            x = Math.floor(e.pageX / lines.size);
            y = Math.floor(e.pageY / lines.size);
        } else {
            x = Math.floor(e.clientX / lines.size);
            y = Math.floor(e.clientY / lines.size);
        }
        // Проверяем нажали ли в пределах доски
        if (x >= 0 && y >= 0 && x < lines.cols && y < lines.rows) {
            // Если нет выбраной ячейки, выбираем ну на которую нажали
            if (!lines.selectedCell.isSelected()) {
                lines.selectedCell.setSelected(x, y);
                lines.drawCell(x, y);
            }
        }
    }, false);

    /** Событие при отпускании кнопки мыши */
    document.addEventListener('mouseup', function(e) {
        if (lines.isAnimate) return;
        if (e.pageX || e.pageY) {
            x = Math.floor(e.pageX / lines.size);
            y = Math.floor(e.pageY / lines.size);
        } else {
            x = Math.floor(e.clientX / lines.size);
            y = Math.floor(e.clientY / lines.size);
        }
        // Если есть выбранная ячейка
        if (lines.selectedCell.isSelected()) {
            var selectedX = lines.selectedCell.x;
            var selectedY = lines.selectedCell.y;
            // Если в ячейки есть шарик
            if (lines.board[selectedX][selectedY] !== 0) {
                // Запоминаем выбраный шарик
                lines.selectedBall = lines.board[selectedX][selectedY];
            } else if (lines.selectedBall !== null) {
                // Если ячейка пустая, перемещаем шарик
                lines.moveSelectedBall(selectedX, selectedY);
            }
            // Выбранную ячейку очищаем
            lines.selectedCell.clearSelected();
            lines.drawCell(selectedX, selectedY);
        }
    }, false);
};

/**
 * Перемещаем шарик
 * @member Lines
 * @param {Number} movedToX координата назначения x
 * @param {Number} movedToY координата назначения y
 */
Lines.prototype.moveSelectedBall = function(movedToX, movedToY) {
    var selectedBall = this.selectedBall;
    // Ищем путь с помощью алгоритма А*
    var path = new AStar(selectedBall.x, selectedBall.y, movedToX, movedToY, this.board);
    // Если путь найден запускаем анимацию перемещения шарика
    if (path.length !== 0) {
        // После перемещения шарика, ячейка становиться свободной и в нее можно генерировать новые шарики
        // А позиция в которую шарик переместили не должна быть доступна для генерации новых шариков
        // Поэтому нужно удалить из массива возможных позиций текущую позицию шарика и добавить ту в которую переместили шарик
        this.addCurrentPositionAndDeleteMovedPosition(movedToX, movedToY);

        // Запускаем анимацию перемещения шарика
        var lines = this;
        this.timer = setInterval(function () {
            lines.animateMoveBall(selectedBall, path);
        }, 50);
    }
};

/**
 * Удаление текущей позиции и добавление позиции в которую переместили шарик в массив возможных позиций
 * @member Lines
 * @param {Number} movedToX координата назначения x
 * @param {Number} movedToY координата назначения y
 */
Lines.prototype.addCurrentPositionAndDeleteMovedPosition = function(movedToX, movedToY) {
    var currentPositionBall, movedToPositionBall;
    // Вычисляем позиции в которую перемещается шарик и в которой он находился
    currentPositionBall = this.selectedBall.y * this.rows + this.selectedBall.x;
    movedToPositionBall = movedToY * this.rows + movedToX;
    // Позиция в которую перемещается шарик удаляется из массива возможных позиций
    this.possibleNewPositionBall.splice(this.possibleNewPositionBall.indexOf(movedToPositionBall), 1);
    // Позиция в которой шарик находился добавляется в массив возможных позиций
    this.possibleNewPositionBall.push(currentPositionBall);
};

/**
 * Анимация. Перемещаем шарик
 * @member Lines
 * @param {Ball} ball перемещаемый шарик
 * @param {Array} path найденый кратчайщий путь
 */
Lines.prototype.animateMoveBall = function(ball, path) {
    // Если еще не пришли в конечную точку
    if (path.length > 0) {
        // Флаг анимации устанавливаем true
        this.isAnimate = true;
        // Очищаем ячейку в которой находится шарик
        this.board[ball.x][ball.y] = 0;
        // Перерисовываем эту ячейку
        this.drawCell(ball.x, ball.y);

        // Берем слудующие координаты из найденного пути
        var nextNode = path.shift();
        ball.x = nextNode.x;
        ball.y = nextNode.y;
        // Ставим в ячейку с этими координатами шарик
        this.board[nextNode.x][nextNode.y] = ball;
        // И перерисовываем ячейку
        this.drawCell(nextNode.x, nextNode.y);
    } else {
        // Очищаем таймер
        clearInterval(this.timer);
        this.isAnimate = false;
        // Очищаем выбранный шарик
        this.selectedBall = null;
        // Проверяем нет ли в ряду более 5 шариков одного цвета
        this.checkLines(ball.x, ball.y, 0);
    }
};

/**
 * Запуск основных функций игры
 * @member Lines
 */
Lines.prototype.restart = function() {
    // Инициализация переменных
    this.initVariable();
    // Инициализируем доску
    this.initBoard();
    // Инициализируем массив возможных позиции для новых шариков
    this.initPossibleNewPositionBall();
    // Рисуем доску
    this.drawBoard();
    // Создаем три новых следующих шариков
    this.createNewNextBalls();
    // Генерируем позиции в которых будут отображены шарики
    this.generatePositionNewBalls();
    // Отрисовывам шарики
    this.drawNewBalls();
    // И снова создаем три следующих шарика
    this.createNewNextBalls();
    // Отображаем какие шарики будут следующие
    this.drawNextBalls();
};


/**
 * Инициализация переменных
 * @member Lines
 */
Lines.prototype.initVariable = function() {
    this.selectedCell = new Cell(-1, -1);
    this.selectedBall = null;
    this.countAnimateDeleteBalls = 20;
    this.countAnimateAddBalls = 0;
    this.isAnimate = false;
    this.timer = null;
};

/**
 * Инициализация доски
 * @member Lines
 */
Lines.prototype.initBoard = function() {
    var x, y;
    for (x = 0; x < this.cols; x++) {
        this.board[x] = [];
        for (y = 0; y < this.rows; y++) {
            this.board[x][y] = 0;
        }
    }
};

/**
 * Инициализация массива возможных позиции для новых шариков
 * @member Lines
 */
Lines.prototype.initPossibleNewPositionBall = function () {
    var i;
    var cellCount = this.cols * this.rows;
    for (i = 0; i < cellCount; i++) {
        this.possibleNewPositionBall[i] = i;
    }
};

/**
 * Отрисовка доски
 * @member Lines
 */
Lines.prototype.drawBoard = function() {
    var x, y;
    for (x = 0; x < this.cols; x++) {
        for (y = 0; y < this.rows; y++) {
            this.drawCell(x, y);
        }
    }
};

/**
 * Отрисовка ячейки доски
 * @member Lines
 * @param {Number} x координата x ячейки
 * @param {Number} y координата y ячейки
 */
Lines.prototype.drawCell = function(x, y) {
    this.context.clearRect(x * this.size, y * this.size, this.size, this.size);
    if (!this.selectedCell.isSelected()) {
        this.context.fillStyle = "#b9b9b9";
        this.context.strokeStyle = "#676966";
    } else {
        this.context.fillStyle = "#929193";
        this.context.strokeStyle = "#fcfcfc";
    }

    this.context.fillRect(x * this.size, y * this.size, this.size, this.size);

    this.context.beginPath();
    this.context.moveTo(x * this.size + 1, (y + 1) * this.size - 1);
    this.context.lineTo((x + 1) * this.size - 1, (y + 1) * this.size - 1);
    this.context.lineTo((x + 1) * this.size - 1, (y) * this.size);
    this.context.stroke();

    if (!this.selectedCell.isSelected()) {
        this.context.strokeStyle = "#fcfcfc";
    } else {
        this.context.strokeStyle = "#676966";
    }

    this.context.beginPath();
    this.context.moveTo(x * this.size + 1, (y + 1) * this.size - 1);
    this.context.lineTo((x) * this.size + 1, (y) * this.size+1);
    this.context.lineTo((x + 1) * this.size - 1, (y) * this.size+1);
    this.context.stroke();

    if (this.board[x][y] !== 0) {
        this.drawBall(this.board[x][y]);
    }
};

/**
 * Рисуем шарик
 * @member Lines
 * @param {Ball} ball шарик
 */
Lines.prototype.drawBall = function(ball) {
    this.context.fillStyle = ball.color;
    this.context.beginPath();
    this.context.arc(ball.x * this.size + this.radius + 3, ball.y * this.size + this.radius + 3, ball.radius, 0, this.angle, true);
    this.context.fill();
};

/**
 * Создание трех новых шариков с случайной генерацией их цвета
 * @member Lines
 */
Lines.prototype.createNewNextBalls = function() {
    var i, randomColorBall;
    for (i = 0; i < 3; i++) {
        randomColorBall = Math.floor(Math.random() * 5) + 1;
        this.newColorBalls[i] = new Ball(10, 3 + i, this.colorsBall[randomColorBall]);
    }
};

/**
 * Генерация случайных позиций для трех новых шариков
 * @member Lines
 */
Lines.prototype.generatePositionNewBalls = function() {
    var randomPositionX, randomPositionY, i;
    var possibleNewPositionBallLength, randomPositionIndex, randomPosition;

    // Для трех вновь сгенерированных цветов
    for (i in this.newColorBalls) {
        // Берем случайную позицию из массива возможных позиций
        possibleNewPositionBallLength = this.possibleNewPositionBall.length;
        randomPositionIndex = Math.floor(Math.random() * possibleNewPositionBallLength);
        randomPosition = this.possibleNewPositionBall.splice(randomPositionIndex, 1)[0];
        // Вычисляем какой x и y для этой позиции
        randomPositionX = randomPosition % this.rows;
        randomPositionY = Math.floor(randomPosition / this.cols);
        // Создаем новый шарик в этой позиции
        this.nextBalls[i] = new Ball(randomPositionX, randomPositionY, this.newColorBalls[i].color);
    }
};

/**
 * Отображаем новые шарики
 * @member Lines
 */
Lines.prototype.drawNewBalls = function() {
    var i;
    for (i = 0; i < 3; i++) {
        this.board[this.nextBalls[i].x][this.nextBalls[i].y] = this.nextBalls[i];
    }
    var lines = this;
    this.timer = setInterval(function () {
        lines.animateAddBalls();
    }, 50);
};

/**
 * Анимация. Добавляем шарики
 * @member Lines
 */
Lines.prototype.animateAddBalls = function() {
    var i;
    // Если колчество тактов анимации меньше 21
    if (this.countAnimateAddBalls < 21) {
        this.isAnimate = true;
        // Для новых шариков увеличиваем радиус и перерисовываем
        for (i in this.nextBalls) {
            this.nextBalls[i].radius = this.countAnimateAddBalls;
            this.drawCell(this.nextBalls[i].x, this.nextBalls[i].y);
        }
        this.countAnimateAddBalls++;
    } else {
        // Очищаем таймер
        clearInterval(this.timer);
        this.isAnimate = false;
        this.countAnimateAddBalls = 0;

        // Для каждого из трех новых шариков проеверяем не образовалось ли где-нибудь линии из 5 и более шариков одного цвета
        for (i in this.nextBalls) {
            this.checkLines(this.nextBalls[i].x, this.nextBalls[i].y, 1);
        }
    }
};

/**
 * Отображаем новые шарики
 * @member Lines
 */
Lines.prototype.drawNextBalls = function() {
    var i;
    for (i in this.newColorBalls) {
        this.drawBall(this.newColorBalls[i]);
    }
};

/**
 * Проверяем есть ли в какой-нибудь линии больше 5 шариков одного цвета
 * @member Lines
 * @param {Number} x координата x
 * @param {Number} y координата y
 * @param {Number} type тип вызова. Если вызвали из функции @see Lines.animateAddBalls то не генерируем новые шарики, если из функции @see Lines.animateMoveBall то генерируем
 */
Lines.prototype.checkLines = function(x, y, type) {
    var i;
    // Массив для найденых шариков в одном направлении
    var forwardFindBalls = [];
    // Массив для найденых шариков в обратном напривлении направлении
    var oppositeFindBalls = [];
    // Итоговый массив полученый слиянием двух предыдущих
    var mergeFindBalls = [];
    // Текущий шарик с которого начинается проврека
    var currentBall = this.board[x][y];
    // Добавляем в итоговый массив всех найденых шариков текущий шарик с которого начинается проверка
    mergeFindBalls.push(currentBall);
    // Проходим по всем возможным направлениям, то есть по вертикали, горизонтали и диаганали
    for (i in this.directionCheck) {
        // В одну сторону
        forwardFindBalls = this.findBallsOneColorInLine(currentBall, this.directionCheck[i][0], this.directionCheck[i][1]);
        if (forwardFindBalls.length > 0) {
            mergeFindBalls = mergeFindBalls.concat(forwardFindBalls);
        }
        // В другую сторону
        oppositeFindBalls = this.findBallsOneColorInLine(currentBall, -this.directionCheck[i][0], -this.directionCheck[i][1]);
        if (oppositeFindBalls.length > 0) {
            mergeFindBalls = mergeFindBalls.concat(oppositeFindBalls);
        }

        // Если нашли 5 или более шариков одного цвета
        if (mergeFindBalls.length >= 5) {
            // Запускаем таймер удаления шаров с доски
            var lines = this;
            this.timer = setInterval(function () {
                lines.animateDeleteBalls(mergeFindBalls);
            }, 50);
            break;
        }
        else {
            // Делаем срез первого элемента массива, то есть только текущий шарик,
            // чтобы в следующий итерации для следующего напрвления массив был "чистый"
            mergeFindBalls = mergeFindBalls.slice(0, 1);
        }
    }

    // Если ничего не нашли и вызов функции происходил при перемещении шарика пользователем
    if (mergeFindBalls.length < 5 && type === 0) {
        // Проверяем не окончена ли игра
        if (this.checkGameOver()) {
            // Генерируем позиции в которых будут отображены шарики
            this.generatePositionNewBalls();
            // Отрисовывам шарики
            this.drawNewBalls();
            // И снова создаем три следующих шарика
            this.createNewNextBalls();
            // Отображаем какие шарики будут следующие
            this.drawNextBalls();
        } else {
            alert("Game over");
            this.restart();
        }
    }
};

/**
 * Нахождение шариков одного цвета находящихся на одной линии
 * @member Lines
 * @param {Ball} currentBall
 * @param {Number} directionX
 * @param {Number} directionY
 */
Lines.prototype.findBallsOneColorInLine = function(currentBall, directionX, directionY) {
    // Вычисляем следующие координаты в зависимости от направления
    var nextX = currentBall.x + directionX;
    var nextY = currentBall.y + directionY;
    // Массив найденых шариков
    var findBalls = [];
    // Следующий шарик
    var nextBall;

    // Если следующие координаты не выходят за пределы доски и в ячейки с новыми координатами присутствует шарик
    if (nextX >=0 && nextY >= 0 && nextX < this.cols && nextY < this.rows && this.board[nextX][nextY] !== 0) {
        // Получаем следующий шарик
        nextBall = this.board[nextX][nextY];
        // Пока цвета текущего и следующего шарика совпадают
        while (nextBall.color == currentBall.color) {
            // Добавляем шарик в массив найденых
            findBalls.push(nextBall);
            // Пересчитываем следующие координаты в зависимости от направления
            nextX += directionX;
            nextY += directionY;
            // Если следующие координаты не выходят за пределы доски и в ячейки с новыми координатами присутствует шарик
            if (nextX >= 0 && nextY >= 0 && nextX < this.cols && nextY < this.rows && this.board[nextX][nextY] !== 0) {
                // Получаем следующий шарик
                nextBall = this.board[nextX][nextY];
            } else {
                break;
            }
        }
    }
    // Возвращаем массив найденых шариков
    return findBalls;
};

/**
 * Анимация. Убираем шарики
 * @member Lines
 * @param {Array} findBalls удаляемые шарики
 */
Lines.prototype.animateDeleteBalls = function(deletedBalls) {
    var i, findBallPosition;
    // Пока такт удаления анимации больше нуля
    if (this.countAnimateDeleteBalls > 0) {
        this.isAnimate = true;
        // Для каждого из удаляемых шариков
        for (i in deletedBalls) {
            // Уменьшаем радиус
            deletedBalls[i].radius = this.countAnimateDeleteBalls;
            // Перерисовываем
            this.drawCell(deletedBalls[i].x, deletedBalls[i].y);
        }
        this.countAnimateDeleteBalls--;
    } else {
        // Очищаем таймер
        clearInterval(this.timer);
        this.isAnimate = false;
        this.countAnimateDeleteBalls = 20;

        // Для каждого из удаляемых шариков
        for (i in deletedBalls) {
            // Добавляем позицию в которой находился шарик в массив возможных позиций
            findBallPosition = deletedBalls[i].y * this.rows + deletedBalls[i].x;
            this.possibleNewPositionBall.push(findBallPosition);
            // Очищаем ячейку доски от шарика
            this.board[deletedBalls[i].x][deletedBalls[i].y] = 0;
            this.drawCell(deletedBalls[i].x, deletedBalls[i].y);
        }
    }
};

/**
 * Проверка не окончена ли игра
 * Критерий проигрыша, если заполнены почти все ячейки и генерировать новый шарики становиться некуда
 * @member Lines
 * @return {Boolean}
 */
Lines.prototype.checkGameOver = function() {
    // Если количество возможных позиций в массиве позиций меньше 3, то считаем что игра окончена
    if (this.possibleNewPositionBall.length > 3) {
        return true;
    }
    return false;
};

/**
 * Ячейка
 * @constructor
 * @this {Ceil}
 * @author Vitaliy Shakhlin (http://jsgame.ru)
 * @param {Number} x кооридната x ячейки
 * @param {Number} y кооридната y ячейки
 */
function Cell(x, y) {
    this.x = x;
    this.y = y;
}

Cell.prototype = {
    /** @type {Number} Координата x */
    x: 0,
    /** @type {Number} Координата y */
    y: 0
};

/**
 * Выбрана ли ячейка
 * @member Cell
 * @return {Boolean} true если выбрана, false если нет
 */
Cell.prototype.isSelected = function () {
    if (this.x != -1 && this.y != -1) {
        return true;
    }
    return false;
};

/**
 * Установить значения ячейки
 * @member Cell
 * @param {Numer} x координата x
 * @param {Numer} y координата y
 */
Cell.prototype.setSelected = function (x, y) {
    this.x = x;
    this.y = y;
};

/**
 * Очищаем значения ячейки
 * @member Cell
 */
Cell.prototype.clearSelected = function () {
    this.x = -1;
    this.y = -1;
};

/**
 * Шарик
 * @constructor
 * @this {Ball}
 * @author Vitaliy Shakhlin (http://jsgame.ru)
 * @param {Number} x кооридната x шарика
 * @param {Number} y кооридната y шарика
 * @param {Number} color цвет шарика
 */
function Ball(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 21;
}

Ball.prototype = {
    /** @type {Number} Координата x */
    x: 0,
    /** @type {Number} Координата y */
    y: 0,
    /** @type {String} Цвет */
    color: '',
    /** @type {Nubmer} Радиус */
    radius: 21
};


/**
 * Обеъект AStar для расчета кратчайшего пути от одной точки к другой, учинывая препятствия на пути
 * @constructor
 * @this {AStar}
 * @author Vitaliy Shakhlin (http://jsgame.ru)
 * @version 1.0
 * @param {Number} startX кооридната x стартовой точки
 * @param {Number} startY кооридната y стартовой точки
 * @param {Number} endX кооридната x стартовой точки
 * @param {Number} endY кооридната y стартовой точки
 * @param {Array} map карта, массив точек
 * @return {Array} path расчитаный путь
 */
function AStar (startX, startY, endX, endY, map) {
    var i, x, y, g1, g2;
    var currentNode;
    // Инициализируем открытый и закрытый списки 
    this.openList = [];
    this.closeList = [];
    // Инициализируем стартовый узел
    var startNode = new Node(startX, startY);
    // Добавляем начальный узел к открытому списку
    this.openList.push(startNode);
    // Делаем текущей первую точку из открытого списка и удаляем ее оттуда.
    while (currentNode = this.openList.shift()) {
        // перемещаем его в закрытый список
        this.closeList.push(currentNode);
        // Проверяем достигли ли мы уже конечной точки
        if(currentNode.x == endX && currentNode.y == endY) {
            var curr = currentNode;
            var path = [];
            // Проходимся по всем родителям начиная от текущей точки, это и будет наш путь
            while(curr.parent) {
                path.push(curr);
                curr = curr.parent;
            }
            // Возвращаем найденный путь, предварительно поменяв порядок элементов на обратный (задом-наперед)
            return path.reverse();
        }
        // Для каждой из восьми соседних точек
        for (i in this.deltas) {
            x =  currentNode.x + this.deltas[i][0];
            y =  currentNode.y + this.deltas[i][1];
            // Проверяем входит ли точка в пределы карты
            if (x >= 0 && y >= 0 && x < 9 && y < 9) {
                // Если точка проходима и не находиться в закрытом списке
                var isAlreadyClose = this.isAlreadyList(this.closeList, x, y);
                if (map[x][y] === 0 && isAlreadyClose == -1) {
                    // Если точка еще не в открытом списке
                    var isAlreadyOpen = this.isAlreadyList(this.openList, x, y);
                    if (isAlreadyOpen == -1) {
                        // Создаем соседнюю точку
                        var neighbor = new Node(x, y);
                        // Делаем текущую клетку родительской для это клетки
                        neighbor.parent = currentNode;
                        // Рассчитываем H - эвристическое значение расстояния от ТЕКУЩЕЙ клетки до КОНЕЧНОЙ (только по вертикали или горизонтали, и не учитываются преграды на пути)
                        neighbor.calculateH(endX, endY);
                        // Рассчитываем G - стоимость передвижения из стартовой точки A к данной клетке, следуя найденному пути к этой клетке
                        //neighbor.calculateG(currentNode.x, currentNode.y);
                        neighbor.g = currentNode.g + neighbor.g;
                        // Рассчитываем f как сумму g и h
                        neighbor.f = neighbor.g + neighbor.h;
                        // Добавляем к открытому списку
                        this.openList.push(neighbor);
                    }
                    // Если точка уже в открытом списке то проверяем, не дешевле ли будет путь через эту клетку
                    else {
                        g1 = this.openList[isAlreadyOpen].g;
                        g2 = currentNode.g + this.openList[isAlreadyOpen].g;
                        // Для сравнения используем стоимость G
                        if (g1 > g2) {
                            // Если это так, то меняем родителя клетки на текущую клетку
                            this.openList[isAlreadyOpen].parent = currentNode;
                        }
                    }
                }
            }
        }
        // Сортируем список по возрастаниюF
        if (this.openList.length > 1) {
            this.openList.sort(this.sortList);
        }
    }
    // Если путь не найден возвращаем пустой массив
    return [];
}
AStar.prototype = {
    /** @type {Array} openList открытый список */
    openList: null,
    /** @type {Array} closeList закрытый список */
    closeList: null,
    /** @type {Array} направления движения */
    deltas: [[-1, 0], [0, 1], [1, 0], [0, -1]]
};

/** Функция проверяет находиться ли уже узел с координатами x и y в открытом или закрытом списке
 * @param {Array} list список
 * @param {Number} x кооридната x
 * @param {Number} y кооридната y
 * @return {Number} i возвращает номер найденого узла в списке или -1 если не нашли
 */
AStar.prototype.isAlreadyList = function (list, x, y) {
    for (var i in list) {
        if (list[i].x == x && list[i].y == y)
            return i;
    }
    return -1;
};

/** Сортируем открытый список по возрастанию стоимости клетки (F)
 * @param {Object} a узел
 * @param {Object} b узел
 * @return {Number} возвращает 1 если f первого узла больше f второго -1 в обратном случае и 0 если они равны
 */
AStar.prototype.sortList = function(a, b) {
    if (a.f > b.f)
        return 1;
    else if (a.f < b.f)
        return -1;
    else
        return 0;
};
/** Класс для узла. Каждый узел имеет координаты x и y, необходимые для расчета параметры f,g и h и родительский узел
 * @param {Number} x кооридната x узла
 * @param {Number} y кооридната y узла
 * @return {Object} node объект новый узел
 */
function Node(x, y) {
    this.x = x;
    this.y = y;
}
Node.prototype = {
    /** @type {Number} g стоимость передвижения из одного узла к данному узлу */
    g: 10,
    /** @type {Number} h эвристическое значение расстояния от ТЕКУЩЕГО узла до КОНЕЧНОГО (только по вертикали или горизонтали, и не учитываются преграды на пути) */
    h: 0,
    /** @type {Number} f сумма h и g */
    f: 0,
    /** @type {Object} parent родительский узел */
    parent: null
};

/** Функция расчитывает H - эвристическое значение расстояния от ТЕКУЩЕЙ клетки до КОНЕЧНОЙ (только по вертикали или горизонтали, и не учитываются преграды на пути)
 * @param {Number} endX кооридната x конечной точки
 * @param {Number} endY кооридната y конечной точки
 * @return {Number} возвращает найденое значение
 */
Node.prototype.calculateH = function (endX, endY) {
    this.h = (Math.abs(this.x - endX) + Math.abs(this.y - endY)) * 10;
};

/**
 * Запуск игры производим после загрузки окна
 * @event
 */
window.onload = function() {
    // Создаем игру
    var lines = new Lines();
};
