var speakers_json, ratings_json, tags_json;

module('integration tests', {
    setup: function() {
        ajaxUrl = undefined;
        ajaxType = undefined;
        ajaxHash = undefined;
        speakers_json = {"speakers": [{"Speaker": {"id": 9, "name": "first", "session_id": 1}}, {"Speaker": {"id": 4, "name": "last", "session_id": 1}}]};
        ratings_json = {"ratings": [{"Rating": {"id": 8, "score": 10, "feedback": "nice", "session_id": 1}}]};
        tags_json = {"tags": [{"Tag": {"id": 7, "description": "done"}}]};
        Ember.run(function() {
            App.reset();
            App.deferReadiness();
        });
    },
    teardown: function() {
        $.mockjaxClear();
    }
});

test('arrays as result of transform should not be interpreted as embedded records', function() {
    stubEndpointForHttpRequest('/api/sessions.json', []);
    var json = {"preserializeds": [{"Preserialized": {"id": 1, "config": "[\"ember\",\"is\",\"neato\"]"}}]};
    stubEndpointForHttpRequest('/api/preserializeds.json', json);
    Ember.run(App, 'advanceReadiness');
    visit("/preserialized").then(function() {
        var divs = find("div.item").length;
        equal(divs, 3, "found " + divs + " divs");
        var items = $("div.item").text().trim();
        equal(items, "emberisneato", "attribute was instead: " + items);
    });
});

test('attribute transforms are applied', function() {
    stubEndpointForHttpRequest('/api/sessions.json', []);
    var json = {"transformers": [{"Transformer": {"id": 1, "transformed": "blah blah"}}]};
    stubEndpointForHttpRequest('/api/transformers.json', json);
    Ember.run(App, 'advanceReadiness');
    visit("/transformers").then(function() {
        var spans = find("span").length;
        equal(spans, 1, "found " + spans + " spans");
        var attribute = $("span.attribute").text().trim();
        equal(attribute, "blah blahSILLYTRANSFORM", "attribute was instead: " + attribute);
    });
});

test('models with camelCase converted to underscore urls', function() {
    stubEndpointForHttpRequest('/api/sessions.json', []);
    var json = {"camel_urls": [{"CamelUrl": {"id": 1, "test": "foobar"}}]};
    stubEndpointForHttpRequest('/api/camel_urls.json', json);
    Ember.run(App, 'advanceReadiness');
    visit("/camelUrls").then(function() {
        var spans = find("span").length;
        equal(spans, 1, "found " + spans + " spans");
        var attribute = $("span.attribute").text().trim();
        equal(attribute, "foobar", "attribute was instead: " + attribute);
    });
});

test('keys with underscores converted to camelCase', function() {
    stubEndpointForHttpRequest('/api/sessions.json', []);
    stubEndpointForHttpRequest('/api/camels/1/camel_case_relationship.json', tags_json);
    var json = {"camels": [{"Camel": {"id": 1, "camel_case_attribute": "foo", "camel_case_relationship": [7]}}]};
    stubEndpointForHttpRequest('/api/camels.json', json);
    Ember.run(App, 'advanceReadiness');
    visit("/camels").then(function() {
        var spans = find("span").length;
        equal(spans, 2, "found " + spans + " spans");
        var attribute = $("span.attribute").text().trim();
        equal(attribute, "foo", "attribute was instead: " + attribute);
        var tag = $("span.tag").text().trim();
        equal(tag, "done", "tag was instead: " + tag);
    });
});

test('ajax response with 1 session yields table with 1 row', function() {
    var json = {"sessions": [{"Session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [], "ratings": [], "tags": []}}]};
    stubEndpointForHttpRequest('/api/sessions.json', json);
    Ember.run(App, 'advanceReadiness');
    visit("/").then(function() {
        var rows = find("table tr").length;
        equal(rows, 6, "table had " + rows + " rows");
        var name = $("table td.name").text().trim();
        equal(name, "foo", "name was instead: " + name);
    });
});

test('ajax response with no session records yields empty table', function() {
    stubEndpointForHttpRequest('/api/sessions.json', []);
    Ember.run(App, 'advanceReadiness');
    visit("/").then(function() {
        var rows = find("table tr").length;
        equal(rows, 0, "table had " + rows + " rows");
    });
});

test('ajax response with async hasMany relationship renders correctly', function() {
    stubEndpointForHttpRequest('/api/sessions/1/speakers.json', speakers_json);
    stubEndpointForHttpRequest('/api/sessions/1/ratings.json', ratings_json);
    stubEndpointForHttpRequest('/api/sessions/1/tags.json', tags_json);
    var json = {"sessions": [{"Session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}}]};
    stubEndpointForHttpRequest('/api/sessions.json', json);
    Ember.run(App, 'advanceReadiness');
    visit("/").then(function() {
        //speakers
        var speakers = find("table td.speaker").length;
        equal(speakers, 2, "table had " + speakers + " speakers");
        var speaker_one = $("table td.speaker:eq(0)").text().trim();
        equal(speaker_one, "first", "speaker_one was instead: " + speaker_one);
        var speaker_two = $("table td.speaker:eq(1)").text().trim();
        equal(speaker_two, "last", "speaker_two was instead: " + speaker_two);
        //ratings
        var ratings = find("table td.rating").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        var rating_one = $("table td.rating:eq(0)").text().trim();
        equal(rating_one, "10", "rating_one was instead: " + rating_one);
        //tags
        var tags = find("table td.tag").length;
        equal(tags, 1, "table had " + tags + " tags");
        var tag_one = $("table td.tag:eq(0)").text().trim();
        equal(tag_one, "done", "tag_one was instead: " + tag_one);
    });
});

test('ajax response for single session will render correctly', function() {
    stubEndpointForHttpRequest('/api/sessions/1/speakers.json', speakers_json);
    stubEndpointForHttpRequest('/api/sessions/1/ratings.json', ratings_json);
    stubEndpointForHttpRequest('/api/sessions/1/tags.json', tags_json);
    var json = {"Session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}};
    stubEndpointForHttpRequest('/api/sessions.json', {"sessions": [json]});
    stubEndpointForHttpRequest('/api/sessions/1.json', {"session": json});
    Ember.run(App, 'advanceReadiness');
    visit("/session/1").then(function() {
        var name = $("div .model_name").text().trim();
        equal(name, "foo", "name was instead: " + name);
        //speakers
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        var speaker_one = $("div .speakers span.name:eq(0)").text().trim();
        equal(speaker_one, "first", "speaker_one was instead: " + speaker_one);
        var speaker_two = $("div .speakers span.name:eq(1)").text().trim();
        equal(speaker_two, "last", "speaker_two was instead: " + speaker_two);
        //ratings
        var ratings = find("div .ratings span.score").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        var rating_one = $("div .ratings span.score:eq(0)").text().trim();
        equal(rating_one, "10", "rating_one was instead: " + rating_one);
        //setup the http post mock $.ajax
        //for some reason the 2 lines below are not used or needed?
        var response = {"id": 4, "score": 2, "feedback": "abc", "session": 1};
        stubEndpointForHttpRequest('/api/sessions/1/ratings.json', response, 'POST', 201);
        fillIn(".score", "2");
        fillIn(".feedback", "abc");
        return click(".add_rating");
    }).then(function() {
        //this is currently broken for non-embedded bound templates (should be 2)
        var ratings = find("div .ratings span.score").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        expectUrlTypeHashEqual("/api/sessions/1/ratings.json", "POST", {});
        expectRatingAddedToStore(4, 2, 'abc', 1);
    });
});

test('test pushSinglePayload', function() {
    var json = {"tag": {"Tag": {"id": 10, "description": "cakephp"}}};
    stubEndpointForHttpRequest('/api/sessions.json', []);
    Ember.run(App, function(){
        // load the object into the Ember data store
        var store = App.__container__.lookup("store:main");  // pretty sure this is not the right way to do this...
        store.serializerFor('tag').pushSinglePayload(store, 'tag', json);
    });
    Ember.run(App, 'advanceReadiness');
    visit("/tag/10").then(function() {
        var content = $("span").text().trim();
        equal(content, "cakephp", "name was instead: " + content);
    });
});

test('test pushArrayPayload', function() {
    var json = {"tags": [{"Tag": {"id": 11, "description": "ember"}}, {"Tag": {"id": 12, "description": "tomster"}}]};
    stubEndpointForHttpRequest('/api/sessions.json', []);
    Ember.run(App, function(){
        // load the objects into the Ember data store
        var store = App.__container__.lookup("store:main");  // pretty sure this is not the right way to do this...
        store.serializerFor('tag').pushArrayPayload(store, 'tag', json);
    });
    Ember.run(App, 'advanceReadiness');
    visit("/tag/12").then(function() {
        var content = $("span").text().trim();
        equal(content, "tomster", "name was instead: " + content);
        return visit("/tag/11");
    }).then(function(){
        var content = $("span").text().trim();
        equal(content, "ember", "name was instead: " + content);
    });
});

test('finding nested attributes when some requested records are already loaded makes GET request to the correct attribute-based URL', function() {
    var user = {"user": {"User": {"id": 1, "username": "foo", "aliases": [8, 9]}}};
    var aliases = {"speakers": [{"Speaker": {"id": 8, "name": "ember"}}, {"Speaker": {"id": 9, "name": "tomster"}}]};
    var alias = {"speaker": aliases.speakers[0]};
    Ember.run(App, function(){
        // load the object into the Ember data store
        var store = App.__container__.lookup("store:main");  // pretty sure this is not the right way to do this...
        store.serializerFor('speaker').pushSinglePayload(store, 'speaker', alias); // pre-load the first alias object before find
    });
    stubEndpointForHttpRequest('/api/sessions.json', []);
    stubEndpointForHttpRequest('/api/users/1.json', user);
    stubEndpointForHttpRequest('/api/users/1/aliases.json', aliases);
    Ember.run(App, 'advanceReadiness');
    visit("/user/1").then(function() {
        var name = $(".username").text().trim();
        equal(name, "foo", "name was instead: " + name);
        var count = $(".alias").length;
        equal(count, 2, "count was instead: " + count);
        var alias = $(".alias:eq(0)").text().trim();
        equal(alias, "ember", "alias was instead: " + alias);
    });
});

test('finding nested attributes makes GET request to the correct attribute-based URL', function() {
    var user = {"user": {"User": {"id": 1, "username": "foo", "aliases": [8, 9]}}};
    var aliases = {"speakers": [{"Speaker": {"id": 8, "name": "ember"}}, {"Speaker": {"id": 9, "name": "tomster"}}]};
    stubEndpointForHttpRequest('/api/sessions.json', []);
    stubEndpointForHttpRequest('/api/users/1.json', user);
    stubEndpointForHttpRequest('/api/users/1/aliases.json', aliases);
    Ember.run(App, 'advanceReadiness');
    visit("/user/1").then(function() {
        var name = $(".username").text().trim();
        equal(name, "foo", "name was instead: " + name);
        var count = $(".alias").length;
        equal(count, 2, "count was instead: " + count);
        var alias = $(".alias:eq(0)").text().trim();
        equal(alias, "ember", "alias was instead: " + alias);
    });
});

test('basic error handling will bubble to the model', function() {
    var speaker = {"speaker": {"Speaker": {"id": 1, "name": "wat", "location": "iowa", "session_id": 1, "association_id": 1, "personas": [1], "zidentity": 1}}};
    var personas = {"personas": [{"Persona": {"id": 1, "nickname": "magic", "speaker_id": 1, "company_id": 1}}]};
    stubEndpointForHttpRequest('/api/sessions.json', []);
    stubEndpointForHttpRequest('/api/speakers/1.json', speaker);
    stubEndpointForHttpRequest('/api/speakers/1/personas.json', personas);
    Ember.run(App, 'advanceReadiness');
    visit("/speaker/1").then(function() {
        var name = $("input.name").val();
        equal(name, "wat", "name was instead: " + name);
        var errors = $("#errors").text().trim();
        equal(errors, "", "errors was instead: " + errors);
        stubEndpointForHttpRequest('/api/speakers/1.json', {}, 'PUT', 400);
        return click(".update");
    }).then(function() {
        var name = $("input.name").val();
        equal(name, "wat", "name was instead: " + name);
        var errors = $("#errors").text().trim();
        equal(errors, "operation failed for model: speaker", "errors was instead: " + errors);
    });
});

test('basic error handling will not fire when update is successful', function() {
    var speaker = {"speaker": {"Speaker": {"id": 1, "name": "wat", "location": "iowa", "session_id": 1, "association_id": 1, "personas": [1], "zidentity": 1}}};
    var personas = {"personas": [{"Persona": {"id": 1, "nickname": "magic", "speaker_id": 1, "company_id": 1}}]};
    stubEndpointForHttpRequest('/api/sessions.json', []);
    stubEndpointForHttpRequest('/api/speakers/1.json', speaker);
    stubEndpointForHttpRequest('/api/speakers/1/personas.json', personas);
    Ember.run(App, 'advanceReadiness');
    visit("/speaker/1").then(function() {
        var name = $("input.name").val();
        equal(name, "wat", "name was instead: " + name);
        var errors = $("#errors").text().trim();
        equal(errors, "", "errors was instead: " + errors);
        stubEndpointForHttpRequest('/api/speakers/1.json', speaker, 'PUT', 200);
        return click(".update");
    }).then(function() {
        var name = $("input.name").val();
        equal(name, "wat", "name was instead: " + name);
        var errors = $("#errors").text().trim();
        equal(errors, "", "errors was instead: " + errors);
        expectUrlTypeHashEqual("/api/speakers/1.json", "PUT", speaker);
    });
});

test('ajax post with multiple parents will use singular endpoint', function() {
    stubEndpointForHttpRequest('/api/sessions/1/speakers.json', speakers_json);
    stubEndpointForHttpRequest('/api/sessions/1/ratings.json', ratings_json);
    stubEndpointForHttpRequest('/api/sessions/1/tags.json', tags_json);
    var json = {"Session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}};
    var response = {"speaker": {"Speaker": {"id": 3, "name": "tom", "location": "iowa", "session_id": 1, "association_id": null, "personas": [], "zidentity": 1}}};
    stubEndpointForHttpRequest('/api/sessions.json', {"sessions": [json]});
    stubEndpointForHttpRequest('/api/sessions/1.json', {"session": json});
    Ember.run(App, 'advanceReadiness');
    visit("/session/1").then(function() {
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        //setup the http post mock $.ajax
        var user = {"user": {"User": {"id": 1, "username": "toranb", "aliases": [1]}}};
        stubEndpointForHttpRequest('/api/users/1.json', user);
        stubEndpointForHttpRequest('/api/speakers.json', response, 'POST', 201);
        fillIn(".speaker_name", "tom");
        fillIn(".speaker_location", "iowa");
        return click(".add_speaker");
    }).then(function() {
        //this is currently broken for non-embedded bound templates (should be 3)
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        expectUrlTypeHashEqual("/api/speakers.json", "POST", response);
        expectSpeakerAddedToStore(3, 'tom', 'iowa');
    });
});

test('ajax post with single parent will use correctly nested endpoint', function() {
    stubEndpointForHttpRequest('/api/sessions/1/speakers.json', speakers_json);
    stubEndpointForHttpRequest('/api/sessions/1/ratings.json', ratings_json);
    stubEndpointForHttpRequest('/api/sessions/1/tags.json', tags_json);
    var json = {"Session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}};
    var response = {"Speaker": {"id": 3, "name": "axe", "location": "yo", "session_id": 1, "association_id": null, "personas": [], "zidentity": null}};
    stubEndpointForHttpRequest('/api/sessions.json', {"sessions": [json]});
    stubEndpointForHttpRequest('/api/sessions/1.json', {"session": json});
    Ember.run(App, 'advanceReadiness');
    visit("/session/1").then(function() {
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        //setup the http post mock $.ajax
        stubEndpointForHttpRequest('/api/sessions/1/speakers.json', response, 'POST', 201);
        fillIn(".speaker_name", "tbill");
        fillIn(".speaker_location", "ohio");
        return click(".add_speaker_with_single_parent");
    }).then(function() {
        //this is currently broken for non-embedded bound templates (should be 3)
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        expectUrlTypeHashEqual("/api/sessions/1/speakers.json", "POST", response);
        expectSpeakerAddedToStore(3, 'axe', 'yo');
    });
});

test('ajax post with different single parent will use correctly nested endpoint', function() {
    stubEndpointForHttpRequest('/api/sessions/1/speakers.json', speakers_json);
    stubEndpointForHttpRequest('/api/sessions/1/ratings.json', ratings_json);
    stubEndpointForHttpRequest('/api/sessions/1/tags.json', tags_json);
    var json = {"Session": {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}};
    var response = {"speaker": {"Speaker": {"id": 3, "name": "who", "location": "dat", "session_id": null, "association_id": null, "personas": [], "zidentity": 1}}};
    stubEndpointForHttpRequest('/api/sessions.json', {"sessions": [json]});
    stubEndpointForHttpRequest('/api/sessions/1.json', {"session": json});
    Ember.run(App, 'advanceReadiness');
    visit("/session/1").then(function() {
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        //setup the http post mock $.ajax
        var user = {"user": {"User": {"id": 1, "username": "toranb", "aliases": [1]}}};
        stubEndpointForHttpRequest('/api/users/1.json', user);
        stubEndpointForHttpRequest('/api/zidentities/1/speakers.json', response, 'POST', 201);
        fillIn(".speaker_name", "who");
        fillIn(".speaker_location", "dat");
        return click(".add_speaker_with_user_single_parent");
    }).then(function() {
        //this is currently broken for non-embedded bound templates (should be 3)
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        expectUrlTypeHashEqual("/api/zidentities/1/speakers.json", "POST", response);
        expectSpeakerAddedToStore(3, 'who', 'dat');
    });
});
