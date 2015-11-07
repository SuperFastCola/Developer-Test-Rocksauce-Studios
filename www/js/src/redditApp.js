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

	my.checkForJQuery = function(){
		if(typeof window.jQuery != "undefined"){
			clearInterval(my.ready);
			my.ready = null;
			$(document).ready(my.init);
		}
	}

	my.addPageNavigation = function(before,after){

		$(".navigation").remove();

		var navigation = $.trim($("#articleNavigation").html());
		var currentNavigation = $(navigation).clone();

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

					if(Boolean(article.thumbnail.match(/^(nsfw|self|default)/i)) || !Boolean(String(article.thumbnail).match(/\w/) ) ){
						$(currentrow).find(".thumbnail").css("background-image","url(images/unknown.png)");
					}
					else{
						$(currentrow).find(".thumbnail").css("background-image","url(" + article.thumbnail + ")");	
					}
					
					$(currentrow).find(".title").text(article.title);
					$(currentrow).find(".author").text(article.author);
					$(currentrow).find(".num_comments em").text(String(article.num_comments));
					$(currentrow).find(".ups em").text(String(article.ups));
					$(currentrow).find(".downs em").text(String(article.downs));
					$(".articles_area").append(currentrow);
				}
				
				$(".article").bind("click",my.showArticleActions);

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

	my.searchFieldAction = function(keepClass){
		my.getData($(".search_field").val());

		if(typeof keepClass == "undefined"){
			$(".search_field").removeClass("expanded");
		}
	}

	my.showArticleActions = function(e){
		$(".actions").remove();
		var actions = $.trim($("#articleActions").html());
		var currentActions = $(actions).clone();
		var articleid = $(e.currentTarget).attr("data-ref");
		$("body").append(currentActions).addClass("overlay")
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
