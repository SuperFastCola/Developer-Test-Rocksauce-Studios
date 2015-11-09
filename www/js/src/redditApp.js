(function() {

	//overwrite console to prevent errors
	if(!window.console) console = {log:function(){}};

	// object holder
	var my = {};
	my.defaultCategory = "funny";
	my.category = my.defaultCategory;
	my.pages = []; //holds after tags for paing
	my.articles = [];  //holds article for selectable actions overlay
	my.draggableLoaded = false; //switch to check when draggable functionality loaded
	my.canDragArticle = true;
	my.canvasSupport = true;
	my.currentPage = 0;
	my.loading = false;
	my.noResultsCode = null;
	my.before = null;
	my.after = null;
	my.urlParts = Array("https://www.reddit.com/r/","/.json");
	my.ready = null;

	//starts jquery interval checked
	my.startCheck = function(){
		my.ready = setInterval(my.checkForJQuery,10);
	}

	//timer interval to check for Jquery object
	//if found starts main script functions
	my.checkForJQuery = function(){
		if(typeof window.jQuery != "undefined"){
			clearInterval(my.ready);
			my.ready = null;
			$(document).ready(my.init);
		}
	}

	//next and previous functionality
	my.addPageNavigation = function(before,after){

		$(".navigation").remove();

		//return html template
		var currentNavigation = my.returnHtmlTemplate("articleNavigation");

		if(before!=null){
			currentNavigation.find(".prevPage").bind('click',function(e){
				my.currentPage--;
				if(my.currentPage<=0){
					my.currentPage = 0;
					my.getData(my.category);
				}
				else{
					my.getData(undefined,String("after=" + my.pages[my.currentPage] ) );	
				}

				
			});
		}
		else{
			currentNavigation.find(".prevPage").remove();
		}

		if(after!=null){
			currentNavigation.find(".nextPage").bind('click',function(e){
				my.getData(undefined,String("after=" + after));
				my.pages.push(after);
				my.currentPage++;
			});
		}
		else{
			currentNavigation.find(".nextPage").remove();
		}
		
		$(".articles_area").append(currentNavigation);
	}

	//return background image css depeneding on content
	my.returnBackCSS = function(imgSrc){

		//if image matches pattern return not found image
		if(Boolean(imgSrc.match(/^(nsfw|self|default)/i)) || !Boolean(String(imgSrc).match(/\w/) ) ){
			return false;
		}
		else{
			return {"background-image":"url(" + imgSrc + ")"}
		}
	}

	//displays each reddit article
	my.showArticles = function(output){

		my.stopSpinner();
		$(".articles_area").empty();

		my.gotoTopOfPage();

		var template = null;
		my.legacy = null;
		var currentrow = null;

		//flush article out of memory
		delete my.articles;
		my.articles = null;
		my.articles = [];
		
		//return html template	
		template = $.trim($("#articleTemplate").html());

		if($('html').hasClass("ie8")){
			my.legacy = $.trim($("#articleActionsLegacy").html());
		}

		//build each article
		for(var i in output.data.children){

			//add an odd row class - mght be useful
			var rowclass = (i%2==0)?"odd":"";
			var article = output.data.children[i].data;
			my.articles.push(output.data.children[i].data);

			//clone html template for each row
			currentrow = $(template).clone();

			//add key index for article
			$(currentrow).addClass(rowclass).attr("data-ref",i);

			//build code
			var backgroundobject = my.returnBackCSS(article.thumbnail);

			if(backgroundobject){
				$(currentrow).find(".thumbnail").css(backgroundobject);
			}
			else{
				$(currentrow).find(".thumbnail").addClass("noimage");
			}

			if(!Boolean(String(article.title).match(/\s/))){
				article.title = String(article.title).slice(0,20);
				article.title+="...";
			}

			$(currentrow).find(".title").text(article.title);
			$(currentrow).find(".author").text(article.author);
			$(currentrow).find(".num_comments em").text(String(article.num_comments));
			$(currentrow).find(".ups em").text(String(article.ups));
			$(currentrow).find(".downs em").text(String(article.downs));

			if(my.legacy != null){
				var legacyNav = $(my.legacy).clone();
				$(currentrow).find(".articleHolder").append(legacyNav);
				$(currentrow).find(".reddit_fallback,.email_fallback").attr("data-ref",i);
			}

			//add to main articles
			$(".articles_area").append(currentrow);
		}
		

		if(my.legacy!=null){
			my.legacyActions();
		}
		else{
			$(".article").bind("click",my.showarticleActions);	
		}
		
		//append 
		my.addPageNavigation(output.data.before,output.data.after);

		//check if search has a useful value
		my.checkForNoValueInSearch();		

		loadScript("externals.js");
		
		//flush memory
		delete article, currentrow, template;
		currentrow = article = template = null;
	}


	my.legacyActions = function(e){
		$(".reddit_fallback").bind("click",function(e){
				var currentArticle = my.articles[$(e.currentTarget).attr("data-ref")];
				var redditURL = "https://www.reddit.com" + currentArticle.permalink;
				my.openLinkInWindow(redditURL);
		}).attr;

		$(".email_fallback").bind("click",function(e){
				var currentArticle = my.articles[$(e.currentTarget).attr("data-ref")];
				var redditURL = "https://www.reddit.com" + currentArticle.permalink;
				my.openEmailPrompt(redditURL);
		});
	}

	//check for word characters
	my.checkForNoValueInSearch = function(){
		var searchval = $(".search_field").val();


		//if no word character returns defauly category
		if(!Boolean(searchval.match(/\w/))){
			$(".search_field").val(my.defaultCategory);
		}
	}

	//self explanatory
	my.gotoTopOfPage = function(){
		if($("body").scrollTop()!=0)
		{
			$("body").stop().animate({
				scrollTop: 0
			}, 1000);
		}
	}

	//main ajax functionality
	my.getData = function(category,direction){

		if(typeof category != "undefined" && typeof direction=="undefined"){
			my.category = category;
		}

		//check if category matches word character
		if(!Boolean(my.category.match(/\w/))){
			my.category = my.defaultCategory;
		}
		
		//determine url parameters for paging
		var urlParams = "";
		if(typeof direction!="undefined"){
			urlParams = "?count=25&" + direction;
		}

		//construct URL
		if($('html').hasClass("ie9") || $('html').hasClass("ie8")){
			my.urlParts[0] = my.urlParts[0].replace("https","http");
		}

		var fullURL = String(my.urlParts[0] + my.category + my.urlParts[1] + urlParams);
		console.log(fullURL);

		//my.startSpinner();

		//send request
		var promise = $.ajax({
		    url: fullURL,
			dataType: "json",
			type: 'GET'
		} );

		//success handler
		promise.success(my.showArticles);

		//display no results message
		promise.error( function( jqXHR, textStatus, errorThrown ) {
			console.log(jqXHR.responseText);
			my.showNoResults();
		} );

	}

	my.showNoResults = function(){
		$(my.noResultsCode).find("span").text(my.category);
		$(".articles_area").html(my.noResultsCode);
		my.stopSpinner();
	}

	//returns html template as usable code
	my.returnHtmlTemplate = function(id){
		var template = $.trim($(String("#" + id) ).html() );
		return $(template).clone();
	}

	my.searchFieldAction = function(keepClass){
		my.getData($(".search_field").val());

		if(typeof keepClass == "undefined"){
			$(".search_field").removeClass("expanded");
		}
	}

	//gets coordinate for snap back animation of button
	my.snapBackObject = function(id,delay){
		var butn = document.getElementById(id);

		//get original position saved on object
		var coord = String($(butn).attr("data-ref")).split(":");

		//create animation propeties
		var props = {
				"x":coord[0],
				"y":coord[1],
				onComplete:function(){
					$("#articleButton").removeClass("fiftyPercent");
				}
			};

		//adds delay if needed	
		if(typeof delay !="undefined"){
			props.delay = .5;
		}

		//animate
		TweenLite.to(butn,.25,props);	
	}

	//bind or unbind actions overlay functionality
	my.addRemoveActionsClick = function(remove){
		if(typeof remove != "undefined"){
			$(".actionsCloser").unbind("click",my.removeOverlay);
		}
		else{
			$(".actionsCloser").bind("click",my.removeOverlay);
		}
	}

	//removes actions overlay
	my.removeOverlay = function(){
		$("#actions").remove();
		$("body").removeClass("overlay");
	}

	my.openLinkInWindow = function(link){
		window.open(link, 'redditLink');
	}

	my.openEmailPrompt = function(link){
		window.location.href = "mailto:?subject=Check%20out%20this%20Reddit%20post&body="+link;
	}

	//check if article can be dragged
	my.checkForDrag = function(e){

		var butn = document.getElementById("articleButton");

		if(typeof butn != "undefined" && typeof window.matchMedia != "undefined"){
			var smallScreens = ((!window.matchMedia("(min-width: 30em)").matches && window.matchMedia("(max-width: 30em)").matches)?true:false);
			var articlePosition = String($("#articleButton").css("position"));
			var articlePositionRelative = (Boolean(articlePosition.match(/relative/i) ) )?true:false

			if(smallScreens || articlePositionRelative){
				my.canDragArticle = false;
			}
			else{
				my.canDragArticle = true;
			}
		}
		else{
			my.canDragArticle = false;
		}

	}

	//article actions
	my.showarticleActions = function(e){


		//contsruct reddit link
		var currentArticle = my.articles[$(e.currentTarget).attr("data-ref")];
		var redditURL = "https://www.reddit.com" + currentArticle.permalink;

		if(my.draggableLoaded){

			if(my.legacy==null){

				var actionArea = my.returnHtmlTemplate("articleActions");
				
				
				if(!Boolean(String(currentArticle.title).match(/\s/))){
					currentArticle.title = String(currentArticle.title).slice(0,20);
					currentArticle.title+="...";
				}

				actionArea.find(".title").text(currentArticle.title);
				actionArea.find(".author").text(currentArticle.author);
				actionArea.find(".ups").text(currentArticle.ups);
				actionArea.find(".downs").text(currentArticle.downs);

				// make votes holder wider depending on character count
				var characterCount = Number(String(currentArticle.ups).length) + Number(String(currentArticle.downs).length);
				if(characterCount>5){
					actionArea.find(".votesHolder").addClass("wider");
				}

				//build code
				var backgroundobject = my.returnBackCSS(currentArticle.thumbnail);

				//check for thumbnail image
				if(backgroundobject){
					$(actionArea).find(".thumbnail").css(backgroundobject);
				}
				else{
					$(actionArea).find(".thumbnail").addClass("noimage");
				}

				$("body").append(actionArea).addClass("overlay");

				//animate in action options
				TweenLite.to("#actions",.25,{"opacity":1.0});

				//bind actions click
				my.addRemoveActionsClick();

				my.checkForDrag();

				$(".drag,.nodrag").hide();

			}

			//start draggable action
			if(my.canDragArticle && my.legacy==null){
				
				$(".drag").show();

				Draggable.create("#articleButton", {
					type:"x,y", 
					edgeResistance:0.65, 
					bounds:"#actions",
					onDragStart:function() {
						//set original location
						var attr = $("#articleButton").attr("data-ref");
						$("#articleButton").addClass("fiftyPercent");

						if(typeof attr == "undefined"){
							$("#articleButton").attr("data-ref",String(this.x + ":" +this.y));	
						}
					},
					onDragEnd:function() {

						if (this.hitTest("#redditLink", "80%")){
							my.openLinkInWindow(redditURL);
							my.snapBackObject("articleButton",true);
						}
						else if(this.hitTest("#emailLink", "80%")){
							my.openEmailPrompt(redditURL);
							my.snapBackObject("articleButton",true);
						}
						else{
							my.snapBackObject("articleButton");
						}
						
					}
				});
			}
			else{

				$(".nodrag").show();

				var articleButton = document.getElementById("articleButton");

				if(typeof articleButton != "undefined"){
					$("#articleButton").bind("click",function(){
						my.removeOverlay();
					});	
				}

				$("#redditLink").bind("click",function(){
					my.openLinkInWindow(redditURL);
				});

				$("#emailLink").bind("click",function(){
					my.openEmailPrompt(redditURL);
				});
					
			}

			//flush backgorund out of memory
			delete backgroundobject;
			backgroundobject = null;
		}
	}

	my.initializeTickers = function(){
			
			window.ticker = (function(){
				    return  window.requestAnimationFrame       || 
				        window.webkitRequestAnimationFrame || 
				        window.mozRequestAnimationFrame    || 
				        window.oRequestAnimationFrame      || 
				        window.msRequestAnimationFrame     || 
				        function(/* function */ callback, /* DOMElement */ element){
				            return window.setTimeout(callback, 1000 / 60);
				        };
				})();

				window.stopTicker = (function(){
					return window.cancelAnimationFrame          ||
				        window.webkitCancelRequestAnimationFrame    ||
				        window.mozCancelRequestAnimationFrame       ||
				        window.oCancelRequestAnimationFrame     ||
				        window.msCancelRequestAnimationFrame        ||
				        clearTimeout
				})();
	}

	var spinner = {
		radius:64,
		points: [],
		sections: 12,
		speed: 30,
		canvas: document.createElement("canvas"),
		holder: null,
	}

	my.createPreloaderCanvas = function(attachToId,initObject){
		var halfRadius = (initObject.radius/2) - 3;

		for(var i = 0; i < initObject.sections; i++) {
			//math help - http://stackoverflow.com/questions/13608186/trying-to-plot-coordinates-around-the-edge-of-a-circle
			var startX = 0 + halfRadius/2 * Math.cos(2 * Math.PI * i / initObject.sections);
		    var startY = 0 + halfRadius/2 * Math.sin(2 * Math.PI * i / initObject.sections);   
		    var endX = 0 + halfRadius * Math.cos(2 * Math.PI * i / initObject.sections);
		    var endY = 0 + halfRadius * Math.sin(2 * Math.PI * i / initObject.sections);   
			initObject.points.push([startX,startY,endX,endY]);
		}

		initObject.canvas.width = initObject.radius;
		initObject.canvas.height = initObject.radius;
		initObject.canvas.id = "spinner";

		console.log(window.CanvasRenderingContext2D);

		if(typeof window.CanvasRenderingContext2D == "undefined"){
			my.canvasSupport = false;
		}
		else{
			initObject.context = initObject.canvas.getContext("2d");
			initObject.context.translate(initObject.radius/2,initObject.radius/2);
			document.body.appendChild(initObject.canvas)
		}

		my.initializeTickers();

	}

	my.drawSpinner = function(){

		var c = spinner.context;
		var r = spinner.radius;
		var p = spinner.points;
		c.translate(-(r/2),-(r/2));
		c.globalAlpha = 1;
		//c.fillStyle = "#ffffff";
		c.clearRect(0,0,r,r);
		c.translate(r/2,r/2);
		c.rotate(Math.PI/spinner.speed);
		
		var alpha = .5;
		var inc = .5/5;

		for(var i in p){
			if(i>5){
				alpha += inc;
			}

			c.globalAlpha = alpha;
			c.lineWidth = 5;
      		c.strokeStyle = '#03b6fd';
      		c.lineCap="round";
			c.beginPath();
			c.moveTo(p[i][0],p[i][1]);
			c.lineTo(p[i][2],p[i][3]);
			c.stroke();
		}

		c.globalAlpha=1;

		if(my.loading){
			window.ticker(my.drawSpinner);	
		}	
	}

	my.startSpinner = function(){
		my.loading = true;

		if(my.canvasSupport){
			spinner.canvas.style.display= "block";
			my.drawSpinner();
		}
	}

	my.stopSpinner = function(){
		my.loading = false;

		if(my.canvasSupport){
			spinner.canvas.style.display= "none";
		}
	}

	my.assignFunctions = function(){
		
		$(".search_field").focus(function(){
			var text = String($(this).val());

			$(this).addClass("expanded");

			if(!Boolean(text.match(/\w/i))){
				$(this).val("");
			}	
		}).val(my.category);

		$(".search_field").blur(function(){
			my.searchFieldAction();
		});

		$(".search_field").keypress(function(e) {
		  if (e.which == 13){
		    e.preventDefault();
		    my.searchFieldAction(true);
		  }
		});

		$(".search_field").keyup(function(e) {
			if(String($(this).val()).length>2){
			 	my.searchFieldAction(true);
			}
		});

		$(window).resize(my.checkForDrag);
	}

	// creates the XMLHTTP Object
	function createXMLHttpRequest() {
		try	{return new ActiveXObject("Msxml2.XMLHTTP");}
		catch (e) { }

		try{return new ActiveXObject("Microsoft.XMLHTTP");}
		catch (e) { }
		
		try{return new XMLHttpRequest();}
		catch (e) { }
		
		return null;
	}

	//dynamically load in additional Tweenlite libraries
	function loadScript(scriptname){		
		var xhr = createXMLHttpRequest();

		xhr.onreadystatechange = function() 
		{
			if (xhr.readyState==4) 
			{// Request is finished
				if (xhr.status!=200){
					//console.log(xhr);
				}// end if 
				else{
					appendScript(xhr.responseText);
				}// end if 
			}// end main if
		}// end onreadystatechange function
		
		xhr.open("GET", "js/lib/" + scriptname, true);
		xhr.setRequestHeader("Content-type","application/javascript");
		xhr.send();
	}

	//append script to document head
	function appendScript(output){
		var head = document.head || document.getElementsByTagName("head")[0];
		var s = document.createElement("script");
		s.type = "text/javascript";
		s.text = output;
		head.appendChild(s);

		my.draggableLoaded = true;
	}


	my.init = function () {
		my.createPreloaderCanvas("allArticles",spinner);
		my.getData();
		my.assignFunctions();
		my.noResultsCode = my.returnHtmlTemplate("articletemplateNoresults");
	}
	
	return my;

}()).startCheck();
