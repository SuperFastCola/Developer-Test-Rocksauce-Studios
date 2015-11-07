(function() {


	//overwrite console to prevent errors
	if(!window.console) console = {log:function(){}};

	// object holder
	var my = {};
	my.category = "funny";
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

	my.showArticles = function(output){

		if(output.data.after!=null){
			my.after = output.data.after;
		}

		if(output.data.before!=null){
			my.before = output.data.before;
		}

		$(".articles_area").empty();

			var template = null;
	
			var currentrow = null;
				
			template = $.trim($("#articletemplate").html());

				for(var i in output.data.children){
					var rowclass = (i%2==0)?"odd":"";
					var article = output.data.children[i].data;

					currentrow = $(template).clone();
					$(currentrow).addClass(rowclass);

					console.log(article.thumbnail);
					
					if(!Boolean(article.thumbnail.match(/nsfw/i))){
						$(currentrow).find(".thumbnail").css("background-image","url(" + article.thumbnail + ")");	
					}
					else{
						$(currentrow).find(".thumbnail").css("background-image","url(images/unknown.png)");
					}
					
					$(currentrow).find(".title").text(article.title);
					$(currentrow).find(".author").text(article.author);
					$(currentrow).find(".num_comments").text(String(article.num_comments));
					$(currentrow).find(".ups").text(String(article.ups));
					$(currentrow).find(".downs").text(String(article.downs));
					$(".articles_area").append(currentrow);
				}
		


		// currentrow = template = null;
	}

	my.getData = function(category){

		if(typeof category != "undefined"){
			my.category = category;
		}

		var promise = $.ajax({
		    url:  String(my.urlParts[0] + my.category + my.urlParts[1]),
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
			$(".search_field").val("");
			my.getData(true);
		});
	}

	my.init = function () {
		console.log("Ready");
		my.getData();
		my.assignFunctions();
	}
	
	return my;

}()).startCheck();
