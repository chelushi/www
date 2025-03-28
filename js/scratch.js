class ScratchCard {
    constructor() {
        this.canvas = document.getElementById('scratchCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.rows = 4;
        this.cols = 5;
        this.cellWidth = 100;
        this.cellHeight = 80;
        this.padding = 10;
        
        // 设置中奖号码
        this.winningNumbers = [3, 6, 8, 16, 20, 66, 88, 99];
        
        // 设置奖励文字
        this.rewards = [
            '奶茶！！',
            '冰！！',
            '蛋糕！！'
        ];
        
        // 设置奖励概率（每个奖励对应的概率，总和应为100）
        this.rewardProbabilities = [50, 30, 20]; // 默认概率：奖励1 40%, 奖励2 35%, 奖励3 25%
        
        // 设置中奖区域数量的概率（0-5个区域）
        // 数组中的每个数字代表对应数量中奖区域的概率（0-100）
        this.winningAreaProbabilities = [25, 20, 18, 13, 10, 9]; // 默认概率：0个10%, 1个30%, 2个20%, 3个20%, 4个13%, 5个7%
        
        // 创建临时画布用于存储数字
        this.numberCanvas = document.createElement('canvas');
        this.numberCtx = this.numberCanvas.getContext('2d');
        
        // 创建临时画布用于存储刮刮层
        this.scratchCanvas = document.createElement('canvas');
        this.scratchCtx = this.scratchCanvas.getContext('2d');
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.generateNewCard();
    }

    setupCanvas() {
        // 设置画布大小以适应新的布局
        this.canvas.width = this.cols * this.cellWidth + (this.cols + 1) * this.padding;
        this.canvas.height = this.rows * this.cellHeight + (this.rows + 1) * this.padding + 60; // 额外空间用于显示中奖号码
        
        // 设置临时画布大小
        this.numberCanvas.width = this.canvas.width;
        this.numberCanvas.height = this.canvas.height;
        this.scratchCanvas.width = this.canvas.width;
        this.scratchCanvas.height = this.canvas.height;
    }

    setupEventListeners() {
        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseUp.bind(this));

        // 按钮事件
        document.getElementById('newCard').addEventListener('click', () => this.generateNewCard());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareToWeChat());
    }

    generateNewCard() {
        // 清空所有画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.numberCtx.clearRect(0, 0, this.numberCanvas.width, this.numberCanvas.height);
        this.scratchCtx.clearRect(0, 0, this.scratchCanvas.width, this.scratchCanvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.numberCtx.fillStyle = '#ffffff';
        this.numberCtx.fillRect(0, 0, this.numberCanvas.width, this.numberCanvas.height);
        this.scratchCtx.fillStyle = '#ffffff';
        this.scratchCtx.fillRect(0, 0, this.scratchCanvas.width, this.scratchCanvas.height);
        
        // 生成中奖号码（从8个号码中随机选择一个）
        this.winningNumber = this.winningNumbers[Math.floor(Math.random() * this.winningNumbers.length)];
        
        // 绘制中奖号码
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 24px Microsoft YaHei';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`中奖号码：${this.winningNumber}`, this.canvas.width / 2, 30);
        
        // 生成所有可用号码（0-100，除去中奖号码）
        const availableNumbers = Array.from({length: 101}, (_, i) => i)
            .filter(num => num !== this.winningNumber);
        
        // 随机打乱可用号码
        for (let i = availableNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
        }
        
        // 根据概率决定中奖区域数量（0-5个）
        const random = Math.random() * 100;
        let sum = 0;
        let winningAreaCount = 0;
        
        // 计算概率总和
        for (let i = 0; i < this.winningAreaProbabilities.length; i++) {
            sum += this.winningAreaProbabilities[i];
            if (random < sum) {
                winningAreaCount = i;
                break;
            }
        }
        
        // 确保至少有一个中奖区域
        if (winningAreaCount === 0) {
            winningAreaCount = 1;
        }
        
        // 生成中奖区域索引
        const winningAreaIndices = new Set();
        while (winningAreaIndices.size < winningAreaCount) {
            winningAreaIndices.add(Math.floor(Math.random() * (this.rows * this.cols)));
        }
        
        // 生成每个区域的数字和奖品
        this.cells = [];
        let availableIndex = 0;
        
        for (let row = 0; row < this.rows; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const areaIndex = row * this.cols + col;
                let number, reward;
                
                if (winningAreaIndices.has(areaIndex)) {
                    // 中奖区域：使用中奖号码
                    number = this.winningNumber;
                    reward = this.selectReward();
                } else {
                    // 非中奖区域：从可用号码中选择一个未使用的号码
                    number = availableNumbers[availableIndex++];
                    reward = null;
                }
                
                this.cells[row][col] = {
                    number: number,
                    reward: reward,
                    isScratched: false,
                    scratchedArea: 0
                };
            }
        }
        
        // 绘制所有区域
        this.drawAllCells();
    }

    drawAllCells() {
        // 清空临时画布
        this.numberCtx.clearRect(0, 0, this.numberCanvas.width, this.numberCanvas.height);
        this.scratchCtx.clearRect(0, 0, this.scratchCanvas.width, this.scratchCanvas.height);
        
        // 在临时画布上绘制数字
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = col * this.cellWidth + (col + 1) * this.padding;
                const y = row * this.cellHeight + (row + 1) * this.padding + 60;
                
                // 绘制区域背景
                this.numberCtx.fillStyle = '#f0f0f0';
                this.numberCtx.fillRect(x, y, this.cellWidth, this.cellHeight);
                
                // 绘制边框
                this.numberCtx.strokeStyle = '#cccccc';
                this.numberCtx.strokeRect(x, y, this.cellWidth, this.cellHeight);
                
                const cell = this.cells[row][col];
                
                // 绘制数字
                this.numberCtx.fillStyle = cell.number === this.winningNumber ? '#ff0000' : '#000000';
                this.numberCtx.font = 'bold 24px Microsoft YaHei';
                this.numberCtx.textAlign = 'center';
                this.numberCtx.textBaseline = 'middle';
                this.numberCtx.fillText(cell.number.toString(), x + this.cellWidth / 2, y + this.cellHeight / 2);
                
                // 如果数字与中奖号码完全匹配，显示奖励文字
                if (cell.number === this.winningNumber && cell.reward) {
                    this.numberCtx.fillStyle = '#ff0000';
                    this.numberCtx.font = '14px Microsoft YaHei';
                    this.numberCtx.fillText(cell.reward, x + this.cellWidth / 2, y + this.cellHeight / 2 + 20);
                }
                
                // 绘制刮刮层
                this.scratchCtx.fillStyle = '#666666';
                this.scratchCtx.fillRect(x, y, this.cellWidth, this.cellHeight);
                
                // 添加纹理效果
                this.scratchCtx.fillStyle = '#777777';
                for (let i = 0; i < 5; i++) {
                    this.scratchCtx.fillRect(
                        x + Math.random() * this.cellWidth,
                        y + Math.random() * this.cellHeight,
                        2,
                        2
                    );
                }
            }
        }
        
        // 更新主画布
        this.updateMainCanvas();
    }

    updateMainCanvas() {
        // 清空主画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制中奖号码
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 24px Microsoft YaHei';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`中奖号码：${this.winningNumber}`, this.canvas.width / 2, 30);
        
        // 绘制数字层
        this.ctx.drawImage(this.numberCanvas, 0, 0);
        
        // 绘制刮刮层
        this.ctx.drawImage(this.scratchCanvas, 0, 0);
    }

    getCellAtPosition(x, y) {
        // 检查是否在中奖号码区域
        if (y < 60) return null;
        
        // 调整y坐标，减去中奖号码区域的高度
        y -= 60;
        
        // 计算行列
        const row = Math.floor(y / (this.cellHeight + this.padding));
        const col = Math.floor(x / (this.cellWidth + this.padding));
        
        // 检查是否在有效范围内
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return { row, col };
        }
        return null;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.isDrawing = true;
        this.lastX = (touch.clientX - rect.left) * scaleX;
        this.lastY = (touch.clientY - rect.top) * scaleY;
        this.scratch(this.lastX, this.lastY);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDrawing) return;
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const currentX = (touch.clientX - rect.left) * scaleX;
        const currentY = (touch.clientY - rect.top) * scaleY;
        
        this.scratchLine(this.lastX, this.lastY, currentX, currentY);
        this.lastX = currentX;
        this.lastY = currentY;
    }

    handleTouchEnd() {
        this.isDrawing = false;
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.isDrawing = true;
        this.lastX = (e.clientX - rect.left) * scaleX;
        this.lastY = (e.clientY - rect.top) * scaleY;
        this.scratch(this.lastX, this.lastY);
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;
        
        this.scratchLine(this.lastX, this.lastY, currentX, currentY);
        this.lastX = currentX;
        this.lastY = currentY;
    }

    handleMouseUp() {
        this.isDrawing = false;
    }

    scratch(x, y) {
        const cell = this.getCellAtPosition(x, y);
        if (cell) {
            this.scratchCtx.globalCompositeOperation = 'destination-out';
            this.scratchCtx.beginPath();
            this.scratchCtx.arc(x, y, 15, 0, Math.PI * 2);
            this.scratchCtx.fill();
            this.scratchCtx.globalCompositeOperation = 'source-over';
            
            // 更新刮开区域
            const cellData = this.scratchCtx.getImageData(
                cell.col * this.cellWidth + (cell.col + 1) * this.padding,
                cell.row * this.cellHeight + (cell.row + 1) * this.padding + 60,
                this.cellWidth,
                this.cellHeight
            );
            
            let scratchedPixels = 0;
            for (let i = 3; i < cellData.data.length; i += 4) {
                if (cellData.data[i] === 0) scratchedPixels++;
            }
            
            this.cells[cell.row][cell.col].scratchedArea = scratchedPixels / (this.cellWidth * this.cellHeight);
            
            // 检查是否需要自动刮开
            if (this.cells[cell.row][cell.col].scratchedArea >= 0.8) {
                this.autoScratch(cell.row, cell.col);
            }
            
            this.updateMainCanvas();
        }
    }

    scratchLine(fromX, fromY, toX, toY) {
        const cell = this.getCellAtPosition(fromX, fromY);
        if (cell) {
            this.scratchCtx.globalCompositeOperation = 'destination-out';
            this.scratchCtx.beginPath();
            this.scratchCtx.moveTo(fromX, fromY);
            this.scratchCtx.lineTo(toX, toY);
            this.scratchCtx.lineWidth = 30;
            this.scratchCtx.lineCap = 'round';
            this.scratchCtx.lineJoin = 'round';
            this.scratchCtx.stroke();
            this.scratchCtx.globalCompositeOperation = 'source-over';
            
            // 更新刮开区域
            const cellData = this.scratchCtx.getImageData(
                cell.col * this.cellWidth + (cell.col + 1) * this.padding,
                cell.row * this.cellHeight + (cell.row + 1) * this.padding + 60,
                this.cellWidth,
                this.cellHeight
            );
            
            let scratchedPixels = 0;
            for (let i = 3; i < cellData.data.length; i += 4) {
                if (cellData.data[i] === 0) scratchedPixels++;
            }
            
            this.cells[cell.row][cell.col].scratchedArea = scratchedPixels / (this.cellWidth * this.cellHeight);
            
            // 检查是否需要自动刮开
            if (this.cells[cell.row][cell.col].scratchedArea >= 0.8) {
                this.autoScratch(cell.row, cell.col);
            }
            
            this.updateMainCanvas();
        }
    }

    autoScratch(row, col) {
        const x = col * this.cellWidth + (col + 1) * this.padding;
        const y = row * this.cellHeight + (row + 1) * this.padding + 60;
        
        this.scratchCtx.globalCompositeOperation = 'destination-out';
        this.scratchCtx.fillRect(x, y, this.cellWidth, this.cellHeight);
        this.scratchCtx.globalCompositeOperation = 'source-over';
        
        this.cells[row][col].scratchedArea = 1;
        this.updateMainCanvas();
    }

    shareToWeChat() {
        // 配置微信分享参数
        wx.ready(function() {
            // 分享给朋友
            wx.updateAppMessageShareData({
                title: '来玩刮刮乐！',
                desc: '试试你的运气，看看能刮出什么大奖！',
                link: window.location.href,
                imgUrl: 'https://your-domain.com/share-image.jpg', // 替换为你的分享图片URL
                success: function() {
                    alert('分享成功！');
                },
                fail: function(res) {
                    console.error('分享失败', res);
                    alert('分享失败，请重试');
                }
            });

            // 分享到朋友圈
            wx.updateTimelineShareData({
                title: '来玩刮刮乐！',
                desc: '试试你的运气，看看能刮出什么大奖！',
                link: window.location.href,
                imgUrl: 'https://your-domain.com/share-image.jpg', // 替换为你的分享图片URL
                success: function() {
                    alert('分享成功！');
                },
                fail: function(res) {
                    console.error('分享失败', res);
                    alert('分享失败，请重试');
                }
            });
        });
    }

    // 添加设置中奖区域概率的方法
    setWinningAreaProbabilities(probabilities) {
        // 验证概率数组
        if (!Array.isArray(probabilities) || probabilities.length !== 6) {
            console.error('概率数组必须是长度为6的数组');
            return false;
        }

        // 验证概率值是否在0-100之间
        if (!probabilities.every(p => p >= 0 && p <= 100)) {
            console.error('概率值必须在0-100之间');
            return false;
        }

        // 验证概率总和是否为100
        const sum = probabilities.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 100) > 0.01) { // 使用0.01作为浮点数比较的容差
            console.error('概率总和必须为100');
            return false;
        }

        // 如果0个中奖区域的概率不为0，自动调整其他概率
        if (probabilities[0] > 0) {
            const total = probabilities.slice(1).reduce((a, b) => a + b, 0);
            const ratio = (100 - probabilities[0]) / total;
            probabilities = probabilities.map((p, i) => {
                if (i === 0) return p;
                return Math.round(p * ratio);
            });
        }

        this.winningAreaProbabilities = probabilities;
        return true;
    }

    // 添加设置奖励概率的方法
    setRewardProbabilities(probabilities) {
        // 验证概率数组
        if (!Array.isArray(probabilities) || probabilities.length !== this.rewards.length) {
            console.error('概率数组长度必须与奖励数量相同');
            return false;
        }

        // 验证概率值是否在0-100之间
        if (!probabilities.every(p => p >= 0 && p <= 100)) {
            console.error('概率值必须在0-100之间');
            return false;
        }

        // 验证概率总和是否为100
        const sum = probabilities.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 100) > 0.01) { // 使用0.01作为浮点数比较的容差
            console.error('概率总和必须为100');
            return false;
        }

        this.rewardProbabilities = probabilities;
        return true;
    }

    // 根据概率选择奖励
    selectReward() {
        const random = Math.random() * 100;
        let sum = 0;
        
        for (let i = 0; i < this.rewardProbabilities.length; i++) {
            sum += this.rewardProbabilities[i];
            if (random < sum) {
                return this.rewards[i];
            }
        }
        
        // 如果随机数大于所有概率之和，返回最后一个奖励
        return this.rewards[this.rewards.length - 1];
    }
}

// 初始化游戏
window.addEventListener('load', () => {
    new ScratchCard();
}); 