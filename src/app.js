(function (win, doc) {
    'use strict';

    var tournament = JSON.parse(localStorage.getItem("ReversedPigTournament")) || {
            gip: 0,
            player: 0
        },
        game = {
            bank: 0,
            playerMove: Math.floor(Math.random() + 0.5),
            score: {
                player: 100,
                gip: 100
            }
        },
        holdBtn = $(".hold-btn"),
        boardCanvas = $(".board"),
        wheelCanvas = $(".wheel"),
        info = $(".info"),
        bc = boardCanvas.getContext("2d"),
        wc = wheelCanvas.getContext("2d"),
        W = boardCanvas.width = wheelCanvas.width = window.innerWidth,
        H = boardCanvas.height = wheelCanvas.height = window.innerHeight,
        cX = W/2,
        cY = H/2,
        wheelD = Math.min(W, H) * 0.85,
        wheelR = wheelD/2,
        btnW = Math.round(wheelR/2.5),
        PI2 = 2 * Math.PI,
        sectorAng = PI2/24,
        mDown, startAngle, angVelocity,
        timeBe, angleBe;

    wc.translate(cX, cY);
    bc.translate(cX, cY);

    var wof = new FortuneWheel(wc, wheelD, sectorAng),
        wedge = new Wedge(bc, wheelR),
        center = new Center(bc, wheelR);

    drawBoard();
    drawWheel(0);
    info.innerHTML = "Tournament Score: You " + tournament.player + " | Gip " + tournament.gip;
    holdBtn.style.top = Math.round(cY + wheelR - wheelR/16) + "px";
    holdBtn.style.left = Math.round(cX - btnW/2) + "px";
    holdBtn.style.width = btnW + "px";
    if ( game.playerMove ) {
        setEventListeners();
    }else {
        playGip();
    }
    holdBtn.addEventListener("click", function () {
        if ( game.playerMove ) {
            game.score.gip -= game.bank;
            if ( game.score.gip <= 0 ) {
                game.score.gip = 0;
                showFinal();
            }else {
                game.playerMove = false;
                playGip();
            }
        }
    }, false);


    function playGip() {
        toggleButton("none");
        removeEventListeners();
        game.bank = 0;
        drawBoard();
        setTimeout(gipSpin, 2000);
    }

    function gipSpin() {
        var speed = 0.1 - Math.random() * 0.2;
        while ( Math.abs(speed) < 0.02 ) { speed = 0.1 - Math.random() * 0.2; }
        boardCanvas.style.cursor = "wait";
        spin(0, speed);
    }


    function toggleButton(display) {
        holdBtn.style.display = display;
    }

    function drawBoard() {
        bc.clearRect(0, 0, W, H);
        wedge.draw();
        center.draw(game);
    }

    function drawWheel(ang) {
        wc.clearRect(0, 0, W, H);
        wc.save();
            wc.rotate(ang);
            wof.draw();
        wc.restore();
    }

    function spin(ang, velocity) {
        var rAF = requestAnimationFrame(update);
        function update() {
            drawWheel(ang);
            ang += velocity;
            velocity *= 0.995;
            if ( Math.abs(velocity) > 0.0005 ) {
                rAF = requestAnimationFrame(update);
            }else {
                cancelAnimationFrame(rAF);
                checkResults(ang);
                boardCanvas.style.cursor = "auto";
            }
        }
    }

    function reverseAnim(ang, cb) {
        var add = ( ang > Math.PI ) ? 0.01 : -0.01,
            rAF = requestAnimationFrame(update);
        boardCanvas.style.cursor = "none";
        function update() {
            drawWheel(ang);
            ang += add;
            if ( ang > 0 && ang < PI2 ) {
                rAF = requestAnimationFrame(update);
            }else {
                cancelAnimationFrame(rAF);
                drawWheel(0);
                boardCanvas.style.cursor = "auto";
                cb();
            }
        }
    }

    function checkResults(ang) {
        var _ang = ( ang > 0 ) ? (PI2 - ang%PI2) : (Math.abs(ang))%PI2,
            i = 0,
            points;
        while ( (sectorAng + sectorAng * i) < _ang ) { i++; }
        points = i%6 + 1;
        if ( points !== 1 ) {
            game.bank += points;
        }else {
            game.bank = 0;
            game.playerMove = !game.playerMove;
        }
        drawBoard();
        drawWheel(ang);

        setTimeout(function () {
            reverseAnim(ang, function () {
                if ( game.playerMove ) {
                    setEventListeners();
                    toggleButton("block");
                }else {
                    if ( gipWantsSteal() ) {
                        setTimeout(gipSpin, 1000);
                    }else {
                        game.score.player -= game.bank;
                        if ( game.score.player <= 0 ) {
                            game.score.player = 0;
                            showFinal();
                        }else {
                            game.bank = 0;
                            game.playerMove = true;
                            drawBoard();
                            setEventListeners();
                        }
                    }
                }
            });
        }, 1000);
    }

    function showFinal() {
        var text = ( game.score.gip ) ? "Gip has cleaned you out!" : "You have cleaned Gip out!";
        toggleButton("none");
        removeEventListeners();
        bc.clearRect(-W/2, -H/2, W, H);
        wc.clearRect(-W/2, -H/2, W, H);
        bc.save();
            bc.textBaseline = 'middle';
            bc.textAlign = "center";
            bc.fillStyle = "#2E0C09";
            bc.strokeStyle = "#9C4300";
            bc.lineWidth = 4;
            bc.fillRect(-wheelD/2, -wheelD/8, wheelD, wheelD/4);
            bc.strokeRect(-wheelD/2, -wheelD/8, wheelD, wheelD/4);

            bc.font = "bold " + wheelD/12 + "px fantasy";
            bc.strokeStyle = "#1F0210";
            bc.fillStyle = "#9C4300";
            bc.lineWidth = 1;
            bc.fillText(text, 0, 0);
            bc.strokeText(text, 0, 0);
        bc.restore();

        if ( game.score.gip ) {
            tournament.gip += 1;
        }else {
            tournament.player += 1;
        }

        localStorage.setItem("ReversedPigTournament", JSON.stringify(tournament));
        setTimeout(function () {
            document.location.reload();
        }, 3000);
    }

    function gipWantsSteal() {
        if ( game.score.player - game.bank <= 0 ) {
            return false;

        }
        return game.bank < 20;
    }

    function setEventListeners() {
        boardCanvas.addEventListener("mousedown", onMouseDown, false);
        boardCanvas.addEventListener("mouseup", onMouseUp, false);
        boardCanvas.addEventListener("mousemove", onMouseMove, false);
    }

    function removeEventListeners() {
        boardCanvas.removeEventListener("mousedown", onMouseDown);
        boardCanvas.removeEventListener("mouseup", onMouseUp);
        boardCanvas.removeEventListener("mousemove", onMouseMove);
    }

    function getDistance(x, y) {
        var dx = Math.abs(x - cX ),
            dy = Math.abs(y - cY),
            dist = Math.sqrt(dx*dx + dy*dy);
        return ( dist < wheelR && dist > wheelR/3 ) ? dist : false;
    }

    function onMouseDown(e) {
        var x = e.pageX,
            y = e.pageY,
            inside = getDistance(x, y),
            dx, dy, d, ts, ang;
        if ( inside ) {
            mDown = true;
            boardCanvas.style.cursor = "-webkit-grabbing";
            boardCanvas.style.cursor = "-webkit-grabbing";
            boardCanvas.style.cursor = "-moz-grabbing";
            dx = x - cX;
            dy = y - cY;
            ang = Math.atan2(dy, dx);
            startAngle = ( ang > 0 ) ? ang : PI2 + ang;
            // console.log("startAngle", startAngle);
            angVelocity = 0;
        }
    }

    function onMouseUp(e) {
        var x = e.pageX,
            y = e.pageY,
            // inside = getDistance(x, y),
            dx, dy, d, ts, ang,
            timeDelta, speed;

        if ( mDown ) {
            mDown = false;
            dx = x - cX;
            dy = y - cY;
            ang = Math.atan2(dy, dx);
            ang = ( ang > 0 ) ? ang : PI2 + ang;
            if ( getDistance(x, y) ) {

                ts = e.timeStamp;
                timeBe = timeBe || 0;
                timeDelta = ts - timeBe;
                speed = Math.abs(angVelocity);
                removeEventListeners();
                if ( speed && speed > 1 && timeDelta < 200 ) {
                    spin(ang - startAngle, angVelocity/100);
                    timeBe = null;
                    angleBe = null;
                    boardCanvas.style.cursor = "wait";
                    toggleButton("none");

                }else {
                    reverseAnim(ang, function () {
                        if ( game.playerMove ) {
                            setEventListeners();
                            toggleButton("block");
                        }else {
                            playGip();
                        }
                    });
                }
            }else {
                reverseAnim(ang, function () {
                    if ( game.playerMove ) {
                        setEventListeners();
                        toggleButton("block");
                    }else {
                        playGip();
                    }
                });
                timeBe = null;
                angleBe = null;
                angVelocity = 0;
            }

        }
    }

    function onMouseMove(e) {
        var x = e.pageX,
            y = e.pageY,
            inside = getDistance (x, y),
            dx, dy, ang, d, ts, timeDelta, angDelta;
        if ( mDown && inside ) {
            dx = x - cX;
            dy = y - cY;
            ang = Math.atan2(dy, dx);
            ang = ( ang > 0 ) ? ang : PI2 + ang;
            ts = e.timeStamp;
            timeBe = timeBe || 0;
            angleBe = angleBe || startAngle;
            timeDelta = ts - timeBe;
            angDelta = ang - angleBe;
            drawWheel(ang - startAngle);
            if ( timeDelta > 100 ) {
                angVelocity = (angDelta/timeDelta) * 1000;
                timeBe = ts;
                angleBe = ang;
            }
        }
    }

    function Center(ctx, wr) {

        var size = Math.round(wr);
        var hsize = Math.round(wr/2);
        var qsize = Math.round(wr/4);
        var osize = Math.round(wr/8);

        var canvas = drawCanvas(size);

        this.draw = function (game) {
            var d = qsize + osize,
                lineX = ( game.playerMove ) ? -(hsize - osize/2) : hsize - osize * 1.5;
            ctx.drawImage(canvas, -hsize, -hsize);
            ctx.save();
                ctx.font = "bold " + d + "px fantasy";
                ctx.textBaseline = 'middle';
                ctx.textAlign = "center";
                ctx.fillStyle = "#9C4300";
                ctx.fillText(game.bank, 0, 0);

                ctx.translate(0, size - qsize/2);
                ctx.shadowBlur = 10;
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.fillStyle = "#2E0C09";
                ctx.strokeStyle = "#9C4300";
                ctx.lineWidth = 4;
                ctx.fillRect(-hsize, 0, size, qsize);
                ctx.strokeRect(-hsize, 0, size, qsize);

                ctx.font = "bold " + qsize/3 + "px fantasy";
                ctx.strokeStyle = "#1F0210";
                ctx.fillStyle = "#9C4300";
                ctx.lineWidth = 1;
                ctx.fillText("YOU", -d, qsize/4);
                ctx.fillText(game.score.player, -d, (qsize/4)*3);
                ctx.fillText("GIP", d, qsize/4);
                ctx.fillText(game.score.gip, d, (qsize/4)*3);
                ctx.strokeText("YOU", -d, qsize/4);
                ctx.strokeText(game.score.player, -d, (qsize/4)*3);
                ctx.strokeText("GIP", d, qsize/4);
                ctx.strokeText(game.score.gip, d, (qsize/4)*3);

                ctx.fillRect(lineX, qsize/2, osize, 5);

            ctx.restore();

        };

        function drawCanvas() {
            var canvas = document.createElement("canvas"),
                c = canvas.getContext("2d");
            canvas.width = canvas.height = size;

            c.shadowBlur = 10;
            c.shadowColor = "rgba(0,0,0,0.5)";
            c.fillStyle = "#2E0C09";
            c.strokeStyle = "#9C4300";
            c.lineWidth = 4;
            c.beginPath();
            c.arc(hsize, hsize, size/3, 0, PI2);
            c.fill();
            c.stroke();

            return canvas;
        }
    }

    function Wedge(ctx, wr) {

        var width = Math.round(wr),
            height = Math.round(wr/3),
            wH = Math.round(height/3),
            canvas = drawCanvas();

        this.draw = function () {
            ctx.drawImage(canvas, -width/2, -(cY-wH/2));
        };

        function drawCanvas() {
            var canvas = document.createElement("canvas"),
                c = canvas.getContext("2d"),
                wW = Math.round(wH/2);
            canvas.width = width;
            canvas.height = height;
            bc.save();
                c.shadowBlur = 10;
                c.shadowColor = "rgba(0,0,0,0.5)";
                c.fillStyle = "#2E0C09";
                c.strokeStyle = "#9C4300";
                c.lineWidth = 4;
                c.beginPath();
                c.moveTo(5, 5);
                c.lineTo(width - 5, 5);
                c.lineTo(width - 5, height - wH);
                c.lineTo(width/2 + wW, height - wH);
                c.lineTo(width/2, height -5);
                c.lineTo(width/2 - wW, height - wH);
                c.lineTo(5, height - wH);
                c.lineTo(5, 5);
                c.fill();
                c.stroke();
            c.restore();
            c.font = "bold " + wH + "px fantasy";
            c.textBaseline = 'middle';
            c.lineWidth = 1;
            c.strokeStyle = "#1F0210";
            c.textAlign = "center";
            c.fillStyle = "#9C4300";
            c.fillText("GIP DESREVER", width/2, (height - wH)/2);
            c.strokeText("GIP DESREVER", width/2, (height - wH)/2);
            return canvas;
        }
    }

    function FortuneWheel(ctx, size, angStep) {
        var canvas = drawCanvas(),
            angle = 0;

        this.draw = function () {
            ctx.drawImage(canvas, -size/2, -size/2);
        };

        function drawCanvas() {
            var r = size/2 - 10, // lineWidth/2
                canvas = document.createElement("canvas"),
                c = canvas.getContext("2d"),
                cx = size/2,
                startAng = 0,
                textR = r * 0.85,
                i = 0;
            canvas.width = canvas.height = size;

            c.strokeStyle = "#9C4300";
            c.lineWidth = 3;
            c.font = "bold " + (0.075 * r) + "px sans-serif";
            c.textAlign = "center";
            c.translate(cx, cx);

            for ( ; i < 24; startAng += angStep, i++ ) {
                c.fillStyle = ( i%2 ) ? "#4A1804": (( i%6 ) ? "#4C0E04" : "#1F0210");
                c.beginPath();
                c.arc(0, 0, r, startAng, startAng + angStep);
                c.lineTo(0, 0);
                c.fill();
            }

            for ( i = 0, startAng = 0; i < 24; startAng += angStep, i++ ) {
                c.beginPath();
                c.arc(0, 0, r, startAng, startAng + angStep);
                c.lineTo(0, 0);
                c.stroke();
            }

            c.fillStyle = "#9C4300";
            for ( i = 0, startAng = 0; i < 24; startAng += angStep, i++ ) {
                c.save();
                   c.rotate(startAng + angStep/2);
                   c.fillText((i%6 + 1), 0, -textR);
                   // c.fillText(i, 0, -textR);
                c.restore();
            }

            c.lineWidth = 20;
            c.beginPath();
            c.arc(0, 0, r, 0, 2 * Math.PI);
            c.stroke();

            return canvas;
        }
    }

    function $(s) { return document.querySelector(s); }

}) (window, document);

