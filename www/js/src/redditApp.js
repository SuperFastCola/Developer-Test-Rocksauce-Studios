(function() {


	//overwrite console to prevent errors
	if(!window.console) console = {log:function(){}};

	// object holder
	var my = {};
	my.defaultCategory = "funny";
	my.category = my.defaultCategory;
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
				my.getData(undefined,String("before=" + before));
			});
		}
		else{
			currentNavigation.find(".prevPage").remove();
		}

		if(after!=null){
			currentNavigation.find(".nextPage").bind('click',function(e){
				my.getData(undefined,String("after=" + after));
			});
		}
		else{
			currentNavigation.find(".nextPage").remove();
		}
		
		$(".articles_area").append(currentNavigation);
	}

	my.showArticles = function(output){


		$(".articles_area").empty();

			var template = null;
	
			var currentrow = null;
				
			template = $.trim($("#articleTemplate").html());

				for(var i in output.data.children){
					var rowclass = (i%2==0)?"odd":"";
					var article = output.data.children[i].data;

					currentrow = $(template).clone();
					$(currentrow).addClass(rowclass);

					if(Boolean(article.thumbnail.match(/^(nsfw|self|default)/i)) || !Boolean(String(article.thumbnail).match(/\w/) ) ){
						$(currentrow).find(".thumbnail").css("background-image","url(images/unknown.png)");
					}
					else{
						$(currentrow).find(".thumbnail").css("background-image","url(" + article.thumbnail + ")");	
					}
					
					$(currentrow).find(".title").text(article.title);
					$(currentrow).find(".author").text(article.author);
					$(currentrow).find(".num_comments").text(String(article.num_comments));
					$(currentrow).find(".ups").text(String(article.ups));
					$(currentrow).find(".downs").text(String(article.downs));
					$(".articles_area").append(currentrow);
				}
		
				console.log(output.data.before);
				my.addPageNavigation(output.data.before,output.data.after);

		currentrow = template = null;
	}

	my.getData = function(category,direction){

		if(typeof category != "undefined" && typeof direction=="undefined"){
			my.category = category;
		}
		
		var urlParams = "";
		if(typeof direction!="undefined"){
			urlParams = "?count=25&" + direction;
		}

		var fullURL = String(my.urlParts[0] + my.category + my.urlParts[1] + urlParams);
		console.log(fullURL);

		var promise = $.ajax({
		    url: fullURL,
			dataType: "json",
			type: 'GET'
		} );

		promise.done(my.showArticles);

		promise.fail( function( jqXHR, textStatus, errorThrown ) {
			console.log(jqXHR.responseText);
			console.log(jQuery.parseJSON(jqXHR.responseText) );
		} );
	}

	my.assignFunctions = function(){
		
		$(".search_field").focus(function(){
			var text = String($(this).val());
			if(text.match(/search\ssome\sstuff/i)){
				$(this).val("");
			}	
		});

		$(".search_field").keyup(function(){
			my.getData($(this).val());
		});

		$(".reset").bind('click',function(){
			$(".search_field").val(my.defaultCategory);
			my.getData(my.defaultCategory);
		});


	}

	my.init = function () {
		console.log("Ready");
		my.getData();
		my.assignFunctions();
	}
	
	return my;

}()).startCheck();
