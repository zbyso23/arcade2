		var i;

		var namePrefix = 'enemy-scorpion';


var Svg2Png = function() 
{
	var svg;
	var canvas;
	var ctx;

	var get = (id) => {
		return document.getElementById(id);
	}

	var loadDoc = (url) => {
		console.log('loadDoc', url);
	    return new Promise((resolve, reject) => {
	        var req = new XMLHttpRequest();
	        req.open("GET", url, true);

	        req.onload = () => {
	            if (req.status == 200) 
	            {
	            	console.log('loadDoc responseXML');
	                resolve(req.responseXML);
	            }
                reject(Error(req.statusText));
	        };

	        req.onerror = () => {
	            reject(Error("Something went wrong ... "));
	        };
	        req.send();
		});
	}

	var processSvg = (svg) => {
		console.log('content', svg);
	    return new Promise((resolve, reject) => {
			var x = svg.getElementsByTagName("g");
			var patt = /layer([0-9]+)/g;
			var layers = [];
			var count = 1;
			for (var i = 0; i < x.length; i++) 
			{
				var isLayer = patt.exec(x[i].id);
				if(!isLayer) continue;
				console.log('tag', isLayer, x[i].id, x[i]);
				layers.push({id: x[i].id, count: count, name: '', image: ''});
				count++;
			}
			layers.sort((a, b) => {
				return (a.count - b.count);
			});
			console.log('layers', layers);
			if(layers.length === 0) reject('no layers present!');
			var layer = layers[0];
			var layerLast = layers[layers.length - 1];
			for(var i = 0; i < layers.length; i++)
			{
				var layerId = layers[i].id;
				var layerCount = layers[i].count;

				showLayer(svg, layers, layerId);
				var name = namePrefix + '-right' + layerCount.toString() + '.png';
				var string = new XMLSerializer().serializeToString(svg);
				var image = "data:image/svg+xml;base64," + window.btoa(string);
				layers[i].name = name;
				layers[i].image = image;
				
				// layerToCanvas(name, layerCount, ctx, true);
				//break;
			}
			resolve(layers);
		});
	}

	var layersToCanvas = (layers) => {
	    return new Promise((resolve, reject) => {
			for(var i = 0; i < layers.length; i++)
			{
				var layer = layers[i];
				layerToCanvas(layer.name, layer.count, ctx, layer.image, true);
			}
			resolve('layersToCanvas success');
		});

	}

	var layerToCanvas = (name, count, ctx, imageSVG, flip) => {
		console.log('layerToCanvas', count);
		var img = new Image();
		var name;
		var data;
		img.onload = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
			data = canvas.toDataURL("image/png");
			console.log('data', data, data.length);
			name = [namePrefix, '-right', count.toString(), '.png'].join('');
			sendImage(name, data);
			if(!flip) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.save();
			ctx.scale(-1, 1);
			ctx.drawImage(img, 0, 0, -92, 104);
			data = canvas.toDataURL("image/png");
			console.log('data FLIP', data, data.length);
			name = [namePrefix, '-left', count.toString(), '.png'].join('');
			sendImage(name, data);
			ctx.restore();
			// get('png').src = data;
		}
		var src = imageSVG;
		img.src = src;
	}

	var sendImage = (name, data) => {
		var data64 = data.substring(22);
		var urlParts = ['image.php?', 'name='+name, 'data='+data64];
		var url = urlParts.join('&');
		console.log('sendImage', url, data64.length);
		loadDoc(url).then(result => {
			console.log('sendImage success', result);
		}).catch(e => {
			console.log('sendImage error', e);
		})
	}

	var showLayer = (svg, layers, id) => {
		for(var i = 0; i < layers.length; i++)
		{
			var layerId = layers[i].id;
			var style = (layerId === id) ? 'display:inline' : 'display:none';
			svg.getElementById(layerId).setAttribute('style', style);
		}			
	}

	var process = (image) =>
	{
		console.log('process', image);
		namePrefix = image;
		return new Promise((resolve, reject) => {
			loadDoc(image + "-right.svg").then(processSvg).then(layersToCanvas).then(result => {
				console.log('svg processed', result);
			}).catch(e => {
				console.log('svg processing error', e);
			});
		});
	}

	canvas = get("canvas");
	ctx = canvas.getContext('2d');

	return {
		process: process
	}
}

