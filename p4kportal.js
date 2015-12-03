if (Meteor.isServer) {
	p4k = "http://pitchfork.com";

	Meteor.methods({
	  p4kQuery: function(query) {
	      this.unblock();
		// console.log("sending query to pitchfork: " + query);
	      return Meteor.http.call("GET", p4k + "/search/ac/?query=" + query);
	  }, 
	  p4kURL: function(url){
	      this.unblock();
		// console.log("calling pitchfork with following url" + url );
	      return Meteor.http.call("GET", p4k + url);
	  },
	  getBestQuery: function(pagenum) {
			// console.log("querying for the best shit bro dw i got you");
			return Meteor.http.call("GET", p4k + "/reviews/best/albums/" + pagenum);
	  },
	  getLatestQuery: function() {
			this.unblock();
			return Meteor.http.call("GET", p4k + "/reviews/albums");
	  }, 
	  getSearch: function(query) {
			// console.log("querying for the best shit bro dw i got you");
			return Meteor.http.call("GET", p4k + "/search/more/?query="+ query +"&filter=album_reviews");
	  }
	});
}

if (Meteor.isClient) {

	$(document).ready(function(){
		// Making Latest the active list!
		$(".nav li a:first").trigger("click");
	});


	Meteor.startup(function (){
		pages = 2;
		//populate the best bar and the latest bar
		$('#bestList').empty();
		for (page=1;page<=pages;page++)	{
			console.log("page number: " + page );
			
			Meteor.call("getBestQuery", page, function(error, results){
				$("#wait").fadeOut();
				content = results.content;

				console.log('coneent is as follows');

				var object_list_container = $("<div id=\"main\">").html(results.content).find(".object-list, .bnm-list")[0];

				$(object_list_container).children('li').each(function(index){
						cover = $(this).children('a').children('div.artwork').children('div.lazy').attr('data-content');

						cover = $(cover).attr('src');

						var reviewLink = 'http://www.pitchfork.com' + $(this).children("a").attr('href');
						info = $(this).children('div.info');
						titles = info.children('a');
						upper_title = titles.children('h1').text().trim();
						lower_title = titles.children('h2').text().trim();
						rating = parseFloat(info.children('span.score').text().trim());

						var album = '<li class="list-group-item">';

				    	//  <div class="albumArt" style="background-image:url('http://cdn4.pitchfork.com/albums/17682/homepage_large.947876a0.jpg')"></div>

						album += '<a href="'+ reviewLink +'"><div class = "albumArt" style="background-image:url(\''+ cover +'\')"></div>';
						album += '<div class="albumArtist">' + upper_title + '</div>';
						album += '<div class="albumName">' + lower_title + '</div>';
						album+= '<div class="rating '+ getColorScore(rating) +'">'+ rating +'</div></a>'; 
						console.log("appending: " + album);
						$('#bestList').append(album);

					
				});	
			});
		}

		Meteor.call("getLatestQuery", function(error, results){
				content = results.content;
				var object_list_container = $('<div id="main">').html(results.content).find('.object-grid')[0];
				$(object_list_container).children('li').each(function(index){
					$(this).children('ul').children('li').each(function(index){
						linkRef = $(this).children('a');
						//console.log("reference is: ", linkRef.attr('href'));
						cover = linkRef.children('div.artwork').children('div.lazy').attr('data-content');
						cover = $(cover).attr('src');

						info = linkRef.children('div.info');
						var reviewLink = 'http://www.pitchfork.com' + $(this).children('a').attr('href');
						upper_title = info.children('h1').text().trim();
						lower_title = info.children('h2').text().trim();
						//getting the ratings
						console.log("ratings for: "+linkRef.attr('href'));
						

					var album = '<li class="list-group-item"><a href="'+ reviewLink +'">';
					album += '<div class = "albumArt" style="background-image:url(\''+ cover +'\')"></div>';
					album += '<div class="albumArtist">' + upper_title + '</div>';
					album += '<div class="albumName">' + lower_title + '</div>';

					// album += '<div class="albumName">' +
					// 			'<h1>'+upper_title+'</h1>'+
					// 			'<h2>'+lower_title+'</h2>'+
					// 		'</div>';

					Meteor.call("p4kURL", linkRef.attr('href'),  function(error, results){
							var rating = $('<div id="main">').html(results.content).find('ul.review-meta')
							//there are nested reviews inside a single review, only fetching the first one for now....
							.children('li').first()
							.children('div.info')
							.children('span.score')
							.text().trim();
							album += '<div class="rating '+ getColorScore(parseFloat(rating)) + '">'+ rating +'</div></a></li>';
							$('#latestList').append(album);
					});
					
				});
				
		});


	});
}); 

  // Global search results holder, using it in place of Session for ease.
  window.results; 

  Template.prowl.events({
    'keypress #query, click #search': function (e) {


    	if (e.which == 13 || e.which == 1){

    	// Go into search mode if you're not there already
    	if ($("li.active a").attr('id') != "SEARCH"){
    		$(".nav li a:last").trigger("click");
    	}
		
		$("#reviewList").empty();
    	
    	$("#warning").hide();

        var searchQuery = $("#query").val();

		console.log("query is: " + searchQuery);

        $("#wait").fadeIn();

        Meteor.call("getSearch", searchQuery, function(error, results) {

        var searchResults = $(results.content).find(".object-grid ul li");

        window.searchedReviews = [];

        searchResults.each(function(){
    		window.searchedReviews.push({'url': $(this).find("a").attr('href')});
		});

		console.log("another call");

          if (window.searchedReviews.length){
            _.each(window.searchedReviews, function(reviewObj) {
				console.log("reviewURL: "+reviewObj.url);
                var reviewURL = reviewObj.url;
                //window.results = reviewsObj.objects;
                //Session.set("reviews", reviewsObj.objects);

                // console.log('')

                Meteor.call("p4kURL", reviewURL, function(error, results){

                    // IF PITCHFORK CHANGES IT'S LAYOUT, THE FOLLOWING FOUR LINES MAY NOT RETURN WHAT THEY SHOULD..
                    var score = parseFloat($("<div>").html(results.content).find(".score").text().trim());
                    var artist = $("<div>").html(results.content).find(".score").parent().find("h1").first().text();                    
                    var album = $("<div>").html(results.content).find(".score").parent().find("h2").text();
                    var albumArt = $("<div>").html(results.content).find("#main .artwork img").attr('src');
                     
                    var shallowCopy = _.find(window.searchedReviews, function(item){
                      if (item.url == reviewURL){
                        return item;
                      }
                    });

                    shallowCopy.score = score;
                    shallowCopy.artist = artist;
                    shallowCopy.album = album;
                    shallowCopy.albumArt = albumArt;

                    populateList();
                });
              });

            console.log("Instead I'm in here!");


          }
          else{
            // Alert the user that this is an empty search!

            console.log("YOu should be in here!");
			$("#warning").text("Your search yielded no results, try again!").fadeIn();
			$("#wait").fadeOut();
          }

          //console.log(results.data); //results.data should be a JSON object
        });


        }// 
    }

  });

Template.navigation.events({
	'click #collector a': function(event, template) {
		console.log(event.target.id);
		event.preventDefault();
		//$('#collector a[href="#'+event.target.id+'"]').tab('show');	

		// Hide the warning
		// $("#warning").hide();

		if (event.target.id == 'SEARCH')
			$("#warning").show()
		else
			$("#warning").hide();

		$(".tab-pane").hide();
  		$("#"+event.target.id+".tab-pane").show();
	}
});

}

function populateList(){

    for (var i = 0; i < window.searchedReviews.length; i++){
      if (window.searchedReviews[i].albumArt == undefined){
        return;
      }
    }


      $("#reviewList li").fadeOut().remove();

    // The above makes sure ALL our GETS have been done. 
    _.each(window.searchedReviews, function(obj){
      //Inserting each object.

      console.log(obj);

    // <li class="list-group-item">
    //   <div class="albumArt" style="background-image:url('http://cdn4.pitchfork.com/albums/17682/homepage_large.947876a0.jpg')"></div>
    //   <div class="albumArtist">Wilco</div>
    //   <div class="albumName">Billy Bragg Nananana Album</div>
    //   <div class="rating">3.4</div>
    // </li>

      // var artistName = (obj.name.split("-")[0].trim()? obj.name.split("-")[0].trim() : obj.artist);
      // var albumName = (obj.name.split("-")[1].trim()? obj.name.split("-")[1].trim() : obj.album);

      var album = '<li class="list-group-item"><a href="http://pitchfork.com'+ obj.url +'"><div class="albumArt" style="background-image:url(\''+ obj.albumArt +'\')"></div>';
      album+= '<div class="albumArtist">'+ obj.artist +'</div>';
      album+= '<div class="albumName">'+ obj.album +'</div>';
      album+= '<div class="rating '+ getColorScore(obj.score) +'">'+ obj.score +'</div></a></li>';
      
      // Clear out the list.
	console.log("appending");
	var list = $("#reviewList").append(album);
	console.log(list);
  });

  $("#wait").fadeOut();


}

function getColorScore(score){
	 if (score < 5){
        return "bad";
      }
      else if (score < 7){
        return "alright";
      }
      else if (score < 9){
        return "great";
      }
      else if (score > 9){
        return "perfect";
      }
}
