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
	this.selectedCell = new Cell(-1, -1); 
	// Добавляем события нажатия клавиш
	this.addListeners();
	// Запускаем основные функции игры
	this.restart();
	console.log("start");
};

Lines.prototype = {
	/** @type {Object} Объект HTMLCanvasElement */ 
	canvas : null,
	/** @type {Object} Объект на котором будем рисовать */ 
	context : null,
	/** @type {Number} Ширина  canvas */ 
	width: 700,
	/** @type {Number} Высота canvas */ 
	height: 500,
	/** @type {Number} Количество строк */ 
	rows: 9,
	/** @type {Number} Количество столбцов */ 
	cols: 9,
	/** @type {Number} Таймер для анимации */ 
	timer : null,
	/** @type {Number} Направления движения шариков */
	directionCheck : [[-1, 0], [-1,-1], [0,-1], [1,-1]],
	/** @type {Array} Доска */
	board : [],
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
	/** @type{Array} Массив для временного хранения новых шариков */
	newColorBalls: [],
	nextBalls: [],
	/** @type {Number} Текущее количество шариков на доске */
	countBallsInBoard: 0,
	countAnimate: 20,
	/** @type{Array} Цвета шариков */
	colorsBall: ["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff"]
};

/**
 * Запуск основных функций игры
 * @member Lines
 */
Lines.prototype.restart = function() {
	// Инициализируем доску
	this.initBoard();
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
	if (!this.selectedCell.isSelected()) {
    	this.context.clearRect(x * this.size, y * this.size, this.size, this.size);
		this.context.fillStyle = "#b9b9b9";
		this.context.strokeStyle = "#fcfcfc";
    } else {
		this.context.fillStyle = "#929193";
		this.context.strokeStyle = "#676966";
	}
	/*if (!this.selectedCell.isSelected()) {
		this.context.fillStyle = "#b9b9b9";
	} else {
		this.context.fillStyle = "#929193";
	}*/
	this.context.fillRect(x * this.size, y * this.size, this.size, this.size);
	/*if (!this.selectedCell.isSelected()) {
		this.context.strokeStyle = "#fcfcfc";
	}
	else {
		this.context.strokeStyle = "#676966";
	}*/
	this.context.beginPath();
    this.context.moveTo(x * this.size, (y+1) * this.size);
    this.context.lineTo((x + 1) * this.size - 1, (y+1) * this.size);
    this.context.moveTo((x+1) * this.size, y * this.size);
    this.context.lineTo((x+1) * this.size, (y + 1) * this.size);
    
    if (!this.selectedCell.isSelected()) {
    	this.context.moveTo(x * this.size, y * this.size);
    	this.context.lineTo((x + 1) * this.size - 1, y * this.size);
    	this.context.moveTo(x * this.size, y * this.size);
    	this.context.lineTo(x * this.size, (y + 1) * this.size);
    }
    //this.context.moveTo(x * this.size + 1, y * this.size);
    //this.context.lineTo(x * this.size + 1, (y + 1) * this.size - 2);
    this.context.stroke();
    if (!this.selectedCell.isSelected()) {
    	this.context.strokeStyle = "#676966";
    } else {
    	this.context.strokeStyle = "#fcfcfc";
    } 
    this.context.beginPath();
    this.context.moveTo(x * this.size, (y + 1) * this.size - 1);
    this.context.lineTo((x + 1) * this.size + 1, (y + 1) * this.size - 1);
    this.context.moveTo((x + 1) * this.size - 1, y * this.size);
    this.context.lineTo((x + 1) * this.size - 1, (y + 1) * this.size);
    //this.context.moveTo((x + 1) * this.size - 2, y * this.size + 1);
    //this.context.lineTo((x + 1) * this.size - 2, (y + 1) * this.size);
    this.context.stroke();
    
    //console.log(x+" "+y);
    //console.log(this.board[x][y]);
    if (this.board[x][y] != 0) {
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
* Создание трех новых шариков
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
 * Генерация позиций для трех новых шариков
 * @member Lindes
 */
Lines.prototype.generatePositionNewBalls = function() {
	var randx, randY, i;
	// Проверяем не окончена ли игра, есть ли место для новых шариков
	if (this.checkGameOver()) { 
		// Для трех вновь сгенерированных цветов
		for (i in this.newColorBalls) {
			// Генерируем позицию для нового шарика, проверяя не занята ли уже ячейка
			do {
				randX = Math.floor(Math.random() * (this.cols));
				randY = Math.floor(Math.random() * (this.rows));
			} while (this.board[randX][randY] != 0);
			this.nextBalls[i] = new Ball(randX, randY, this.newColorBalls[i].color);
		}
		// Увеличиваем количество шариков на доске
		this.countBallsInBoard += 3;
		console.log(this.countBallsInBoard);
	}
};

/**
* Проверка не окончена ли игра
* Критерий проигрыша, если заполнены почти все ячейки и генерировать новый шарики становиться некуда
* @member Lines
* @return {Boolean} 
*/
Lines.prototype.checkGameOver = function() {
	// Если количество шариков на доске превышает количество ячеек минус 3, то считаем что игра окончена
	if ((this.countBallsInBoard + 3) <= this.rows * this.cols) {
		return true;
	}
	alert("Game over");
	return false;
};

/**
 * Перемещаем шарик
 * @member Lines
 * @param {Number} moveX координата назначения x
 * @param {Number} moveY координата назначения y
 */
Lines.prototype.moveSelectedBall = function(moveX, moveY) {
	var selectedBall = this.selectedBall;
	// Ищем путь с помощью алгоритма А*
	var path = new AStar(selectedBall.x, selectedBall.y, moveX, moveY, this.board);
	// Если путь найден запускаем анимацию перемещения шарика
	if (path.length != 0) {
		var lines = this;
		this.timer = setInterval(function () {
			lines.animateMoveBall(selectedBall, path);
		}, 50);
	}
};

/**
 * Анимация. Перемещаем шарик
 * @member Lines
 */
Lines.prototype.animateMoveBall = function(ball, path) {
	if (path.length > 0) {
		this.board[ball.x][ball.y] = 0;
		this.drawCell(ball.x, ball.y);
		var nextNode = path.shift();
		ball.x = nextNode.x;
		ball.y = nextNode.y;
		this.board[nextNode.x][nextNode.y] = ball;
		this.drawCell(nextNode.x, nextNode.y);
	} else {
		clearInterval(this.timer);
		this.selectedBall = null;
		this.checkLines(ball.x, ball.y, 0);
	}
};

/**
 * Анимация. Убираем шарики
 * @member Lines
 */
Lines.prototype.animateClearBalls = function(findBalls) {
	if (this.countAnimate > 0) {
		for (i in findBalls) { 
			findBalls[i].radius = this.countAnimate;
			this.drawCell(findBalls[i].x, findBalls[i].y);
		}
		this.countAnimate--;
	} else {
		clearInterval(this.timer);
		for (i in findBalls) { 
			this.board[findBalls[i].x][findBalls[i].y] = 0;
			this.drawCell(findBalls[i].x, findBalls[i].y);
		}
		this.countAnimate = 20;
	}
};

/**
 * Отображаем новые шарики
 */
Lines.prototype.drawNewBalls = function() {
	var i;
	for (i = 0; i < 3; i++) {
		this.board[this.nextBalls[i].x][this.nextBalls[i].y] = this.nextBalls[i];
		this.drawCell(this.nextBalls[i].x, this.nextBalls[i].y);
	}
	for (i = 0; i < 3; i++) {
		this.checkLines(this.nextBalls[i].x, this.nextBalls[i].y, 1);
	}
};

/**
 * Отображаем новые шарики
 */
Lines.prototype.drawNextBalls = function() {
	var i;
	for (i in this.newColorBalls) {
		this.drawBall(this.newColorBalls[i]);
	}
};

/**
 * Проверяем есть ли где-нибудь больше 5 шариков одного цвета
 */
Lines.prototype.checkLines = function(x, y, type) {
	var i, nextX, nextY, nextBall, findBalls1 = [], findBalls2 = [], findBalls = [];
	var currentBall = this.board[x][y];
	findBalls.push(currentBall);
	/*console.log("currentBall:");
	console.log(currentBall);*/
	// проверяем
	for (i in this.directionCheck) {
		findBalls1 = this.checkNextBall(currentBall, this.directionCheck[i][0], this.directionCheck[i][1]);
		if (findBalls1.length > 0) {
			findBalls = findBalls.concat(findBalls1);
		}
		findBalls2 = this.checkNextBall(currentBall, -this.directionCheck[i][0], -this.directionCheck[i][1]);
		if (findBalls2.length > 0) {
			findBalls = findBalls.concat(findBalls2);
		}
		if (findBalls.length >= 5) {
			//findBalls.push(currentBall);
			console.log(findBalls);
			console.log(findBalls.length);
			console.log(this.countBallsInBoard);
			this.countBallsInBoard -= findBalls.length;
			console.log(this.countBallsInBoard);
			var lines = this;
			this.timer = setInterval(function () {
				lines.animateClearBalls(findBalls);
			}, 50);
			break;
		}
		else {
			findBalls = findBalls.slice(0, 1);
		}
	}
	if (findBalls.length < 5 && type == 0) {
		console.log("generate new ball");
		this.generatePositionNewBalls();
		this.drawNewBalls();		
		this.createNewNextBalls();
		this.drawNextBalls();
	}
};

/**
 * 
 */
Lines.prototype.checkNextBall = function(currentBall, directionX, directionY) {
	var nextX = currentBall.x + directionX;
	var nextY = currentBall.y + directionY;
	var findBalls = [];
	var nextBall;
	
	if (nextX >=0 && nextY >= 0 && nextX < this.cols && nextY < this.rows && this.board[nextX][nextY] != 0) {
		nextBall = this.board[nextX][nextY];
		while (nextBall.color == currentBall.color) {
			findBalls.push(nextBall);
			nextX += directionX;
			nextY += directionY;
			if (nextX >= 0 && nextY >= 0 && nextX < this.cols && nextY < this.rows && this.board[nextX][nextY] != 0) {
				nextBall = this.board[nextX][nextY];
			} else {
				break;
			}
		}
	}
	return findBalls;
};

/**
 * Отображаем новые шарики
 */
Lines.prototype.getNextBall = function(currentX, currentY, deltasX, deltasY) {
	var nextX = currentX + deltasX;
	var nextY = currentY + deltasY;
	return this.board[nextX][nextY];
};

/**
 * Обработка событий нажатия на кнопки мыши
 * @event
*/
Lines.prototype.addListeners = function() {	
	var lines = this;
	var x, y;
	
	document.addEventListener('mousedown', function(e) {		
		if (e.pageX || e.pageY) {
			x = Math.floor(e.pageX / lines.size);
			y = Math.floor(e.pageY / lines.size);
		} else {
			x = Math.floor(e.clientX / lines.size);
			y = Math.floor(e.clientY / lines.size);
		}
		if (x >= 0 && y >= 0 && x < lines.cols && y < lines.rows) {
			if (!lines.selectedCell.isSelected()) {
				lines.selectedCell.x = x;
				lines.selectedCell.y = y;
				lines.drawCell(x, y);
			}
		}
	}, false);
	
	document.addEventListener('mouseup', function(e) {		
		if (e.pageX || e.pageY) {
			x = Math.floor(e.pageX / lines.size);
			y = Math.floor(e.pageY / lines.size);
		} else {
			x = Math.floor(e.clientX / lines.size);
			y = Math.floor(e.clientY / lines.size);
		}
		if (x >= 0 && y >= 0 && x < lines.cols && y < lines.rows) {
			if (lines.selectedCell.isSelected()) {
				var selectedX = lines.selectedCell.x;
				var selectedY = lines.selectedCell.y;
				if (lines.board[selectedX][selectedY] != 0) {
					lines.selectedBall = lines.board[selectedX][selectedY];
				} else if (lines.selectedBall != null) {
					lines.moveSelectedBall(selectedX, selectedY);
				}
				lines.selectedCell.x = -1;
				lines.selectedCell.y = -1;
				lines.drawCell(selectedX, selectedY);
			}
		}
	}, false);
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
	var i, x, y;
	// Инициализируем открытый и закрытый списки 
	this.openList = new Array();	
	this.closeList = new Array();
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
				if (map[x][y] == 0 && isAlreadyClose == -1) {					
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
