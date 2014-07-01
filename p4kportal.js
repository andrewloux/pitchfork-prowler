if (Meteor.isServer) {

  Meteor.methods({
      p4kQuery: function(query) {
          this.unblock();
		console.log("sending query to pitchfork: " + query);
          return Meteor.http.call("GET", "http://pitchfork.com/search/ac/?query=" + query);
      }, 
      p4kURL: function(url){
          this.unblock();
		console.log("calling pitchfork with following url" + url );
          return Meteor.http.call("GET", "http://pitchfork.com/" + url);
      },
	  getBestQuery: function() {
			console.log("querying for the best shit bro dw i got you");
			return Meteor.http.call("GET", "http://pitchfork.com/reviews/best/albums/");
	  },
	  getLatestQuery: function() {
			console.log("querying for the latest shit dw bro i got you");
			return Meteor.http.call("GET", "http://pitchfork.com/reviews/albums");
	  }
  });
}

if (Meteor.isClient) {


	Meteor.startup(function (){
		//populate the best bar and the latest bar
		Meteor.call("getBestQuery", function(error, results){
			//clear ul
			$('#bestList').empty();
			content = results.content;
			var object_list_container = $("<div id=\"main\">").html(results.content).find(".object-list, .bnm-list")[0];

			$(object_list_container).children('li').each(function(index){
					cover = $(this).children('a').children('div.artwork').children('div.lazy').attr('data-content');
					console.log(cover);
					info = $(this).children('div.info');
					titles = info.children('a');
					upper_title = titles.children('h1').text().trim();
					lower_title = titles.children('h2').text().trim();
					rating = parseFloat(info.children('span.score').text().trim());

					var album = '<li class="list-group-item">';
					album += '<div class = "albumArt">'+cover+'</div>';
					//var album = '<li class="list-group-item"><div class="albumArt" style="background-image:url(\''+  +'\')"></div>';
					album+= '<div class="albumName">' +
								'<h1>'+upper_title+'</h1>'+
								'<h2>'+lower_title+'</h2>'+
							'</div>';
					album+= '<div class="rating '+ getColorScore(rating) +'">'+ rating +'</div></li>';
					$('#bestList').append(album);

					
			});

			
			//console.log(list);
			
		});
		Meteor.call("getLatestQuery", function(error, results){
				content = results.content;
				var object_list_container = $("<div id=\"main\">").html(results.content).find('.object-grid')[0];
				$(object_list_container).children('li').each(function(index){
					$(this).children('ul').children('li').each(function(index){
						linkRef = $(this).children('a');
						cover = linkRef.children('div.artwork').children('div.lazy').attr('data-content');
						info = linkRef.children('div.info');
						upper_title = info.children('h1').text().trim();
						lower_title = info.children('h2').text().trim();

					var album = '<li class="list-group-item">';
					album += '<div class = "albumArt">'+cover+'</div>';
					album += '<div class="albumName">' +
								'<h1>'+upper_title+'</h1>'+
								'<h2>'+lower_title+'</h2>'+
							'</div></li>';
					$('#latestList').append(album);
				});
				
		});


	});
}); 

  // Global search results holder, using it in place of Session for ease.
  window.results; 

  Template.prowl.events({
    'click #search': function () {

        var searchQuery = $("#query").val();
		console.log("query is: " + searchQuery);

        $("#wait").fadeIn();

        Meteor.call("p4kQuery", searchQuery, function(error, results) {
			console.log("results of the search is: "+results);
          var reviewsObj = _.find(results.data, 
                                  function(item){
                                    if (item.label == "Reviews"){
                                      return item;
                                    }
                                  });
		console.log(reviewsObj);
		console.log("another call");

          if (reviewsObj.objects.length){
            _.each(reviewsObj.objects, function(reviewObj) {
				console.log("reviewURL: "+reviewObj.url);
                var reviewURL = reviewObj.url;
                window.results = reviewsObj.objects;
                //Session.set("reviews", reviewsObj.objects);
                Meteor.call("p4kURL", reviewURL, function(error, results){

                    // IF PITCHFORK CHANGES IT'S LAYOUT, THE FOLLOWING FOUR LINES MAY NOT RETURN WHAT THEY SHOULD..
                    var score = parseFloat($("<div>").html(results.content).find(".score").text().trim());
                    var artist = $("<div>").html(results.content).find(".score").parent().find("h1").first().text();                    
                    var album = $("<div>").html(results.content).find(".score").parent().find("h2").text();
                    var albumArt = $("<div>").html(results.content).find("#main .artwork img").attr('src');
                     
                    var shallowCopy = _.find(window.results, function(item){
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

          }
          else{
            // Alert the user that this is an empty search!
			alert("bitch this is an empty search!");
			$("#wait").fadeOut();
          }

          //console.log(results.data); //results.data should be a JSON object
        });


        // 
    }

  });

Template.navigation.events({
	'click #collector a': function(event, template) {
		console.log(event.target.id);
		event.preventDefault();
		//$('#collector a[href="#'+event.target.id+'"]').tab('show');	
		$(".tab-pane").hide();
  		$("#"+event.target.id+".tab-pane").show();
	}
});

}

function populateList(){

    for (var i = 0; i < window.results.length; i++){
      if (window.results[i].albumArt == undefined){
        return;
      }
    }


      $("#reviewList li").fadeOut().remove();

    // The above makes sure ALL our GETS have been done. 
    _.each(window.results, function(obj){
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

      var album = '<li class="list-group-item"><div class="albumArt" style="background-image:url(\''+ obj.albumArt +'\')"></div>';
      album+= '<div class="albumArtist">'+ obj.artist +'</div>';
      album+= '<div class="albumName">'+ obj.album +'</div>';
      album+= '<div class="rating '+ getColorScore(obj.score) +'">'+ obj.score +'</div></li>';
      
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
      else if (obj.score > 9){
        return "perfect"
      }
}
