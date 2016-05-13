;~function(){

    var canvas = document.getElementById("canvas");
        ctx = canvas.getContext("2d"),
        tempImageData = null,
        imgData = null;

    var filterInput = document.querySelectorAll(".filter-handle input")
        invertInput = document.getElementById("invert"),
        grayscaleInput = document.getElementById("grayscale"),
        sepiaInput = document.getElementById("sepia"),
        brightnessInput = document.getElementById("brightness"),
        thresholdInput = document.getElementById("threshold"),
        blurInput = document.getElementById("blur"),
        blurValInput = document.getElementById("blur-val"),
        reliefInput = document.getElementById("relief"),
        reverseInput = document.getElementById("reverse"),
        imgUpload = document.getElementById("img-upload");  

    function getInitImageData(ele) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        tempImageData = ctx.getImageData(0, 0, img.width, img.height); // 重新获取原始图像数据点信息
        imgData = tempImageData.data;
    }

    function resetImageData() {
        ctx.drawImage(img, 0, 0, img.width, img.height);
    }

    var canvasFilter = {
        invert: function(obj, i) {
            obj[i] = 255 - obj[i];
            obj[i+1] = 255 - obj[i+1];
            obj[i+2] = 255 - obj[i+2];
        },
        grayscale: function(obj, i) {
            var average = (obj[i] + obj[i+1] + obj[i+2]) / 3;
            //var average = 0.2126*obj[i] + 0.7152*obj[i+1] + 0.0722*obj[i+2]; 或者
            obj[i] = obj[i+1] = obj[i+2] = average;
        },
        sepia: function(obj, i) {
            var r = obj[i],
                g = obj[i+1],
                b = obj[i+2];
            obj[i] = (r*0.393)+(g*0.769)+(b*0.189);
            obj[i+1] = (r*0.349)+(g*0.686)+(b*0.168);
            obj[i+2] = (r*0.272)+(g*0.534)+(b*0.131);
        },
        brightness: function(obj, i, brightVal) {
            var r = obj[i],
                g = obj[i+1],
                b = obj[i+2];
            obj[i] += brightVal;
            obj[i+1] += brightVal;
            obj[i+2] += brightVal;
        },
        threshold: function(obj, i, thresholdVal) {
            var average = (obj[i] + obj[i+1] + obj[i+2]) / 3;
            obj[i] = obj[i+1] = obj[i+2] = average > thresholdVal ? 255 : 0;
        },
        relief: function(obj, i, canvas) {
            if ((i+1) % 4 !== 0) { // 每个像素点的第四个（0,1,2,3  4,5,6,7）是透明度。这里取消对透明度的处理
                if ((i+4) % (canvas.width*4) == 0) { // 每行最后一个点，特殊处理。因为它后面没有边界点，所以变通下，取它前一个点
                   obj[i] = obj[i-4];
                   obj[i+1] = obj[i-3];
                   obj[i+2] = obj[i-2];
                   obj[i+3] = obj[i-1];
                   i+=4;
                } else {
                     // 取下一个点和下一行的同列点
                     obj[i] = 255/2         // 平均值
                              + 2*obj[i]   // 当前像素点
                              - obj[i+4]   // 下一点
                              - obj[i+canvas.width*4]; // 下一行的同列点
                }
            } else {  // 最后一行，特殊处理
                 if ((i+1) % 4 !== 0) {
                    obj[i] = obj[i-canvas.width*4];
                 }
            }
        }
    };

    var handleFilter = {
        // 反相：取每个像素点与255的差值
        invert: function() { 
            if (invertInput.checked) {
                for (var i = 0, len = imgData.length; i < len; i+=4) {
                    canvasFilter.invert(imgData, i);
                }
                ctx.putImageData(tempImageData, 0, 0);
            }
        },
        // 灰化：取某个点的rgb的平均值
        grayscale: function() {
            if (grayscaleInput.checked) {
                for (var i = 0, len = imgData.length; i < len; i+=4) {
                    canvasFilter.grayscale(imgData , i);
                }
                ctx.putImageData( tempImageData , 0 , 0);
            }
        },
        // 怀旧：特定公式
        sepia: function() {
            if (sepiaInput.checked) {
                for (var i = 0, len = imgData.length; i < len; i+=4) {
                    canvasFilter.sepia(imgData , i);
                }
                ctx.putImageData( tempImageData , 0 , 0);
            }
        },
        // 变亮：rgb点加上某个数值
        brightness: function() {
            if (brightnessInput.checked) {
                for(var i = 0, len = imgData.length; i < len; i+=4){
                    canvasFilter.brightness(imgData, i, 30);
                }
                ctx.putImageData( tempImageData , 0 , 0);
            }
        },
        // 阈值：将灰度值与设定的阈值比较，如果大于等于阈值，则将该点设置为255，否则设置为0
        //“阈值”命令将灰度或彩色图像转换为高对比度的黑白图像。您可以指定某个色阶作为阈值。所有比阈值亮的像素转换为白色；而所有比阈值暗的像素转换为黑色。“阈值”命令对确定图像的最亮和最暗区域很有用。
        threshold: function() {
            if (thresholdInput.checked) {
                for (var i = 0, len = imgData.length; i < len; i+=4) {
                    canvasFilter.threshold(imgData, i, 150);
                }
                ctx.putImageData(tempImageData, 0, 0);
            }
        },
        // 浮雕：取下一个点和下一行对应的点值
        relief: function() {
            if (reliefInput.checked) {
                for (var i = 0, len = imgData.length; i < len; i++) {
                    canvasFilter.relief(imgData , i , canvas);   
                }
                ctx.putImageData( tempImageData , 0 , 0);
            }
        },
        // 反转
        reverse: function() {
            var tempArr = [];
            if (reverseInput.checked) {
                for (var n = 0; n < canvas.height; n++) {
                    tempArr.length = 0;
                    for (var m = n*canvas.width*4; m < (n+1)*canvas.width*4; m+=4) {
                        tempArr[m - (n*canvas.width*4)] = imgData[m];
                        tempArr[m + 1 - (n*canvas.width*4)] = imgData[m + 1];
                        tempArr[m + 2 - (n*canvas.width*4)] = imgData[m + 2];
                        tempArr[m + 3 - (n*canvas.width*4)] = imgData[m + 3];
                    } 
                    for (var m = n*canvas.width*4; m < (n+1)*canvas.width*4; m+=4) {
                        imgData[m] = tempArr[ tempArr.length - 1 - (m + 3 - (n*canvas.width*4))];
                        imgData[m + 1] = tempArr[ tempArr.length - 1 - (m + 2 - (n*canvas.width*4))];
                        imgData[m + 2] = tempArr[ tempArr.length - 1 - (m + 1 - (n*canvas.width*4))];
                        // imgData[m + 3] = tempArr[ tempArr.length - 1 - (m - (n*canvas.width*4))];
                        // 透明度无需计算，默认都为255
                    } 
                }
                ctx.putImageData( tempImageData , 0 , 0);
            }
        },
        // 模糊 stackblur
        blur: function() {
            blurValInput.removeAttribute('disabled');
            if (blurInput.checked) {
                stackBlurCanvasRGBA('canvas', 0, 0, canvas.width, canvas.height, blurValInput.value);
            }
        }
    };

    blurValInput.setAttribute('disabled', 'disabled');

    for (var i = 0; i < filterInput.length; i+=1) {
        filterInput[i].addEventListener('click', function() {
            getInitImageData();
            if(filterInput[i] !== blurInput) {
                blurValInput.setAttribute('disabled', 'disabled');
            }
        }, false);
    }

    invertInput.addEventListener('click', handleFilter.invert, false);
    grayscaleInput.addEventListener('click', handleFilter.grayscale, false);
    sepiaInput.addEventListener('click', handleFilter.sepia, false);
    thresholdInput.addEventListener('click', handleFilter.threshold, false);
    reliefInput.addEventListener('click', handleFilter.relief, false);
    reverseInput.addEventListener('click', handleFilter.reverse, false);
    blurInput.addEventListener("click", handleFilter.blur, false);
    blurValInput.addEventListener("change", handleFilter.blur, false);

    function uploadImg(file) {
        if (file.files && file.files[0]) {
            var handleImg = document.createElement('img'),
                reader = new FileReader();
            handleImg.addEventListener('load', function() {
                getInitImageData();
                // alert(handleImg.getAttribute('src'));
            }, false);
            reader.addEventListener('load', function(evt) {
                handleImg.src = evt.target.result;
                img.src = handleImg.src;
                canvas.width = img.width;
                canvas.height = img.height;
            }, false);
            reader.readAsDataURL(file.files[0]);
        }
    }

    imgUpload.addEventListener('change', function() {
        uploadImg(imgUpload);
    }, false);

    // init
    var img = new Image();

    img.addEventListener('load', function() {
        getInitImageData();
    }, false);

    img.src = 'sample.jpg';

}();