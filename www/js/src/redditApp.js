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
	my.currentPage = 0;
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

		$(".articles_area").empty();

		my.gotoTopOfPage();

		var template = null;
		var currentrow = null;

		//flush article out of memory
		delete my.articles;
		my.articles = null;
		my.articles = [];
		
		//return html template	
		template = $.trim($("#articleTemplate").html());

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

			$(currentrow).find(".title").text(article.title);
			$(currentrow).find(".author").text(article.author);
			$(currentrow).find(".num_comments em").text(String(article.num_comments));
			$(currentrow).find(".ups em").text(String(article.ups));
			$(currentrow).find(".downs em").text(String(article.downs));

			//add to main articles
			$(".articles_area").append(currentrow);
		}
		
		$(".article").bind("click",my.showarticleActions);

		//append 
		my.addPageNavigation(output.data.before,output.data.after);

		//check if search has a useful value
		my.checkForNoValueInSearch();		

		loadScript("externals.js");
		
		//flush memory
		delete article, currentrow, template;
		currentrow = article = template = null;
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
		var body = $("body, html");
		if(body.scrollTop()!=0)
		{
			body.stop().animate({
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
		var fullURL = String(my.urlParts[0] + my.category + my.urlParts[1] + urlParams);

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
		} );
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

		if(typeof butn != "undefined"){
			var smallScreens = ((!window.matchMedia("(min-width: 30em)").matches && window.matchMedia("(max-width: 30em)").matches)?true:false);
			var articlePosition = String($("#articleButton").css("position"));
			var articlePositionRelative = (Boolean(articlePosition.match(/relative/i) ) )?true:false

			console.log($("#articleButton").css("position"));
			console.log(articlePositionRelative);
			console.log(smallScreens);

			if(smallScreens || articlePositionRelative){
				my.canDragArticle = false;
			}
			else{
				my.canDragArticle = true;
			}
		}

	}

	//article actions
	my.showarticleActions = function(e){

		if(my.draggableLoaded){

			var actionArea = my.returnHtmlTemplate("articleActions");
			var currentArticle = my.articles[$(e.currentTarget).attr("data-ref")];
			
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

			//contsruct reddit link
			var redditURL = "https://www.reddit.com" + currentArticle.permalink;

			my.checkForDrag();

			$(".drag,.nodrag").hide();

			//start draggable action
			if(my.canDragArticle){
				
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

				$("#articleButton").bind("click",function(){
					my.removeOverlay();
				});

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
		my.getData();
		my.assignFunctions();
	}
	
	return my;

}()).startCheck();
