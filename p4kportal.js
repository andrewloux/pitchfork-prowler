if (Meteor.isServer) {

  Meteor.methods({
      p4kQuery: function(query) {
          this.unblock();
          return Meteor.http.call("GET", "http://pitchfork.com/search/ac/?query=" + query);
      }, 
      p4kURL: function(url){
          this.unblock();
          return Meteor.http.call("GET", "http://pitchfork.com/" + url);
      }
  });
}

if (Meteor.isClient) {

  // Global search results holder, using it in place of Session for ease.
  window.results; 

  Template.prowl.events({
    'click #search': function () {

        var searchQuery = $("#query").val();

        $("#wait").fadeIn();

        Meteor.call("p4kQuery", searchQuery, function(error, results) {
          var reviewsObj = _.find(results.data, 
                                  function(item){
                                    if (item.label == "Reviews"){
                                      return item;
                                    }
                                  });

          if (reviewsObj.objects.length){
            _.each(reviewsObj.objects, function(reviewObj) {
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
          }

          //console.log(results.data); //results.data should be a JSON object
        });


        // 
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

      var colorClass;

      if (obj.score < 5){
        colorClass = "bad";
      }
      else if (obj.score < 7){
        colorClass = "alright";
      }
      else if (obj.score < 9){
        colorClass = "great";
      }
      else if (obj.score > 9){
        colorClass = "perfect"
      }

      var album = '<li class="list-group-item"><div class="albumArt" style="background-image:url(\''+ obj.albumArt +'\')"></div>';
      album+= '<div class="albumArtist">'+ obj.artist +'</div>';
      album+= '<div class="albumName">'+ obj.album +'</div>';
      album+= '<div class="rating '+ colorClass +'">'+ obj.score +'</div></li>';
      
      // Clear out the list.
      $("#reviewList").append(album);
  });

  $("#wait").fadeOut();


}
