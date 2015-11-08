(function() {


	//overwrite console to prevent errors
	if(!window.console) console = {log:function(){}};

	// object holder
	var my = {};
	my.defaultCategory = "funny";
	my.category = my.defaultCategory;
	my.pages = [];
	my.articles = [];
	my.currentPage = 0;
	my.before = null;
	my.after = null;
	my.urlParts = Array("https://www.reddit.com/r/","/.json");
	my.ready = null;


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

	my.addPageNavigation = function(before,after){

		$(".navigation").remove();
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

	my.returnBackCSS = function(imgSrc){
		if(Boolean(imgSrc.match(/^(nsfw|self|default)/i)) || !Boolean(String(imgSrc).match(/\w/) ) ){
			return {"background-image":"url(images/unknown.png)"}
		}
		else{
			return {"background-image":"url(" + imgSrc + ")"}
		}
	}

	my.showArticles = function(output){

		$(".articles_area").empty();

		my.gotoTopOfPage();

		var template = null;
		var currentrow = null;

		delete my.articles;
		my.articles = null;
		my.articles = [];
			
		template = $.trim($("#articleTemplate").html());

		for(var i in output.data.children){

			var rowclass = (i%2==0)?"odd":"";
			var article = output.data.children[i].data;
			my.articles.push(output.data.children[i].data);

			currentrow = $(template).clone();
			$(currentrow).addClass(rowclass).attr("data-ref",i);
			$(currentrow).find(".thumbnail").css(my.returnBackCSS(article.thumbnail ));
			$(currentrow).find(".title").text(article.title);
			$(currentrow).find(".author").text(article.author);
			$(currentrow).find(".num_comments em").text(String(article.num_comments));
			$(currentrow).find(".ups em").text(String(article.ups));
			$(currentrow).find(".downs em").text(String(article.downs));
			$(".articles_area").append(currentrow);
		}
		
		$(".article").bind("click",my.showarticleActions);

		my.addPageNavigation(output.data.before,output.data.after);

		my.checkForNoValueInSearch();		
		currentrow = template = null;
	}

	my.checkForNoValueInSearch = function(){
		var searchval = $(".search_field").val();

		if(!Boolean(searchval.match(/\w/))){
			$(".search_field").val(my.defaultCategory);
		}
	}

	my.gotoTopOfPage = function(){
		var body = $("body, html");
		if(body.scrollTop()!=0)
		{
			body.stop().animate({
				scrollTop: 0
			}, 1000);
		}
	}

	my.getData = function(category,direction){

		if(typeof category != "undefined" && typeof direction=="undefined"){
			my.category = category;
		}

		if(!Boolean(my.category.match(/\w/))){
			my.category = my.defaultCategory;
		}
		
		var urlParams = "";
		if(typeof direction!="undefined"){
			urlParams = "?count=25&" + direction;
		}

		var fullURL = String(my.urlParts[0] + my.category + my.urlParts[1] + urlParams);

		var promise = $.ajax({
		    url: fullURL,
			dataType: "json",
			type: 'GET'
		} );

		promise.success(my.showArticles);

		promise.error( function( jqXHR, textStatus, errorThrown ) {
			console.log(jqXHR.responseText);
		} );
	}

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

	my.removeBackgroundTimeout = function(){
		my.addRemoveActionsClick();
	}

	my.snapBackObject = function(id,delay){
		var butn = document.getElementById(id);
		var coord = String($(butn).attr("data-ref")).split(":");
		var props = {
				"x":coord[0],
				"y":coord[1],
				onComplete:function(){
					$("#articleButton").removeClass("fiftyPercent");
					setTimeout(my.removeBackgroundTimeout, 1000);
				}
			};

		if(typeof delay !="undefined"){
			props.delay = .5;
		}

		TweenLite.to(butn,.25,props);	
	}

	my.addRemoveActionsClick = function(remove){
		if(typeof remove != "undefined"){
			$("#actions").unbind("click",my.removeOverlay);
		}
		else{
			$("#actions").bind("click",my.removeOverlay);
		}
	}

	my.removeOverlay = function(){
		$("#actions").remove();
		$("body").removeClass("overlay");
	}

	my.showarticleActions = function(e){

		var actionArea = my.returnHtmlTemplate("articleActions");
		var currentArticle = my.articles[$(e.currentTarget).attr("data-ref")];
		
		actionArea.find(".title").text(currentArticle.title);
		actionArea.find(".thumbnail").css(my.returnBackCSS(currentArticle.thumbnail));

		$("body").append(actionArea).addClass("overlay");
		TweenLite.to("#actions",.25,{"opacity":1.0});
		my.addRemoveActionsClick();

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

				var url = "https://www.reddit.com" + currentArticle.permalink;

				my.addRemoveActionsClick(true);

				if (this.hitTest("#redditLink", "80%")){
					window.open(url, 'redditLink');
					my.snapBackObject("articleButton",true);
				}
				else if(this.hitTest("#emailLink", "80%")){
					window.location.href = "mailto:?subject=Check%20out%20this%20Reddit%20post&body="+url;
					my.snapBackObject("articleButton",true);
				}
				else{
					my.snapBackObject("articleButton");
				}
				
			}
		});
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

	}

	my.init = function () {
		my.getData();
		my.assignFunctions();
	}
	
	return my;

}()).startCheck();
