"use strict";

const assert = require("node:assert/strict");

const _ = require("lodash");

const {zrequire} = require("./lib/namespace.cjs");
const {run_test} = require("./lib/test.cjs");

const stream_data = zrequire("stream_data");
const stream_list_sort = zrequire("stream_list_sort");
const settings_config = zrequire("settings_config");
const channel_folders = zrequire("channel_folders");
const {initialize_user_settings} = zrequire("user_settings");

// Start with always filtering out inactive streams.
const user_settings = {
    demote_inactive_streams: settings_config.demote_inactive_streams_values.always.code,
};
initialize_user_settings({user_settings});
stream_list_sort.set_filter_out_inactives();

const scalene = {
    subscribed: true,
    name: "scalene",
    stream_id: 1,
    pin_to_top: true,
    is_recently_active: true,
    folder_id: 1,
};
const fast_tortoise = {
    subscribed: true,
    name: "fast tortoise",
    stream_id: 2,
    pin_to_top: false,
    is_recently_active: true,
    folder_id: 1,
};
const pneumonia = {
    subscribed: true,
    name: "pneumonia",
    stream_id: 3,
    pin_to_top: false,
    is_recently_active: false,
    folder_id: 1,
};
const clarinet = {
    subscribed: true,
    name: "clarinet",
    stream_id: 4,
    pin_to_top: false,
    is_recently_active: true,
};
const weaving = {
    subscribed: false,
    name: "weaving",
    stream_id: 5,
    pin_to_top: false,
    is_recently_active: true,
};
const stream_hyphen_underscore_slash_colon = {
    subscribed: true,
    name: "stream-hyphen_underscore/slash:colon",
    stream_id: 6,
    pin_to_top: false,
    is_recently_active: true,
    folder_id: 2,
};
const muted_active = {
    subscribed: true,
    name: "muted active",
    stream_id: 7,
    pin_to_top: false,
    is_recently_active: true,
    is_muted: true,
    folder_id: 1,
};
const muted_pinned = {
    subscribed: true,
    name: "muted pinned",
    stream_id: 8,
    pin_to_top: true,
    is_recently_active: true,
    is_muted: true,
};
const archived = {
    subscribed: true,
    name: "archived channel",
    stream_id: 9,
    pin_to_top: true,
    is_archived: true,
};

channel_folders.initialize({
    channel_folders: [
        {
            name: "Frontend",
            description: "Channels for frontend discussions",
            rendered_description: "<p>Channels for frontend discussions</p>",
            creator_id: null,
            date_created: 1596710000,
            id: 1,
            is_archived: false,
        },
        {
            name: "Backend",
            description: "Channels for backend discussions",
            rendered_description: "<p>Channels for backend discussions</p>",
            creator_id: null,
            date_created: 1596720000,
            id: 2,
            is_archived: false,
        },
    ],
});

function sort_groups(query) {
    const streams = stream_data.subscribed_stream_ids();
    return stream_list_sort.sort_groups(streams, query);
}

function test(label, f) {
    run_test(label, (helpers) => {
        stream_data.clear_subscriptions();
        f(helpers);
    });
}

test("no_subscribed_streams", () => {
    const sorted = sort_groups("");
    assert.deepEqual(sorted, {
        sections: [
            {
                id: "pinned-streams",
                inactive_streams: [],
                muted_streams: [],
                section_title: "translated: PINNED CHANNELS",
                streams: [],
            },
            {
                id: "normal-streams",
                inactive_streams: [],
                muted_streams: [],
                section_title: "translated: CHANNELS",
                streams: [],
            },
        ],
        same_as_before: sorted.same_as_before,
    });
    assert.equal(stream_list_sort.first_row(), undefined);
});

test("basics", ({override}) => {
    stream_data.add_sub(scalene);
    stream_data.add_sub(fast_tortoise);
    stream_data.add_sub(pneumonia);
    stream_data.add_sub(clarinet);
    stream_data.add_sub(weaving);
    stream_data.add_sub(stream_hyphen_underscore_slash_colon);
    stream_data.add_sub(muted_active);
    stream_data.add_sub(muted_pinned);
    stream_data.add_sub(archived);

    // Test sorting into categories/alphabetized
    let sorted_sections = sort_groups("").sections;
    const pinned = sorted_sections[0];
    assert.deepEqual(pinned.id, "pinned-streams");
    assert.deepEqual(pinned.streams, [scalene.stream_id]);
    assert.deepEqual(pinned.muted_streams, [muted_pinned.stream_id]);
    const normal = sorted_sections[1];
    assert.deepEqual(normal.id, "normal-streams");
    assert.deepEqual(normal.streams, [
        clarinet.stream_id,
        fast_tortoise.stream_id,
        stream_hyphen_underscore_slash_colon.stream_id,
    ]);
    assert.deepEqual(normal.muted_streams, [muted_active.stream_id]);
    assert.deepEqual(normal.inactive_streams, [pneumonia.stream_id]);

    assert.deepEqual(stream_list_sort.get_stream_ids(), [
        scalene.stream_id,
        muted_pinned.stream_id,
        clarinet.stream_id,
        fast_tortoise.stream_id,
        stream_hyphen_underscore_slash_colon.stream_id,
        muted_active.stream_id,
        pneumonia.stream_id,
    ]);

    assert.equal(
        stream_list_sort.current_section_id_for_stream(scalene.stream_id),
        "pinned-streams",
    );
    assert.equal(
        stream_list_sort.current_section_id_for_stream(clarinet.stream_id),
        "normal-streams",
    );

    // Test keyboard UI / cursor code (currently mostly deleted).
    // TODO/channel-folders: Re-add keyboard navigation tests,
    // including some with filtering. This mainly requires either
    // exporting some parts of the stream_list module, or refactoring
    // to move some of the stream_list data objects to another module.
    const row = stream_list_sort.first_row();
    assert.equal(row.type, "stream");
    assert.equal(row.stream_id, scalene.stream_id);

    // Test filtering
    sorted_sections = sort_groups("s").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].id, "pinned-streams");
    assert.deepEqual(sorted_sections[0].streams, [scalene.stream_id]);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].id, "normal-streams");
    assert.deepEqual(sorted_sections[1].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].streams, [stream_hyphen_underscore_slash_colon.stream_id]);

    // Test searching entire word, case-insensitive
    sorted_sections = sort_groups("PnEuMoNiA").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].streams, []);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].streams, []);
    assert.deepEqual(sorted_sections[1].inactive_streams, [pneumonia.stream_id]);

    // Test searching part of word
    sorted_sections = sort_groups("tortoise").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].streams, []);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].id, "normal-streams");
    assert.deepEqual(sorted_sections[1].streams, [fast_tortoise.stream_id]);
    assert.deepEqual(sorted_sections[1].inactive_streams, []);

    // Test searching stream with spaces
    sorted_sections = sort_groups("fast t").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].streams, []);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].id, "normal-streams");
    assert.deepEqual(sorted_sections[1].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].streams, [fast_tortoise.stream_id]);

    // Test searching part of stream name with non space word separators
    sorted_sections = sort_groups("hyphen").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].streams, []);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].id, "normal-streams");
    assert.deepEqual(sorted_sections[1].streams, [stream_hyphen_underscore_slash_colon.stream_id]);
    assert.deepEqual(sorted_sections[1].inactive_streams, []);

    sorted_sections = sort_groups("hyphen_underscore").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].streams, []);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].id, "normal-streams");
    assert.deepEqual(sorted_sections[1].streams, [stream_hyphen_underscore_slash_colon.stream_id]);
    assert.deepEqual(sorted_sections[1].inactive_streams, []);

    sorted_sections = sort_groups("colon").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].streams, []);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].id, "normal-streams");
    assert.deepEqual(sorted_sections[1].streams, [stream_hyphen_underscore_slash_colon.stream_id]);
    assert.deepEqual(sorted_sections[1].inactive_streams, []);

    sorted_sections = sort_groups("underscore").sections;
    assert.deepEqual(sorted_sections.length, 2);
    assert.deepEqual(sorted_sections[0].streams, []);
    assert.deepEqual(sorted_sections[0].inactive_streams, []);
    assert.deepEqual(sorted_sections[1].id, "normal-streams");
    assert.deepEqual(sorted_sections[1].streams, [stream_hyphen_underscore_slash_colon.stream_id]);
    assert.deepEqual(sorted_sections[1].inactive_streams, []);

    override(user_settings, "web_left_sidebar_show_channel_folders", true);
    sorted_sections = sort_groups("").sections;
    // console.log(stream_list_sort.all_rows)
    assert.deepEqual(sorted_sections.length, 4);
    assert.deepEqual(sorted_sections[1].id, "2");
    assert.deepEqual(sorted_sections[1].section_title, "BACKEND");
    assert.deepEqual(sorted_sections[2].id, "1");
    assert.deepEqual(sorted_sections[2].section_title, "FRONTEND");
    // If both `pin_to_top` is true and folder_id is set, as in
    // the channel `scalene`, then the channel ends up in the pinned
    // section and `folder_id` is ignored.
    assert.deepEqual(sorted_sections[2].streams, [fast_tortoise.stream_id]);
    assert.deepEqual(sorted_sections[2].muted_streams, [muted_active.stream_id]);
    assert.deepEqual(sorted_sections[2].inactive_streams, [pneumonia.stream_id]);
});

test("filter inactives", ({override}) => {
    // Test that we automatically switch to filtering out inactive streams
    // once the user has more than 30 streams.
    override(
        user_settings,
        "demote_inactive_streams",
        settings_config.demote_inactive_streams_values.automatic.code,
    );

    stream_list_sort.set_filter_out_inactives();
    assert.ok(!stream_list_sort.is_filtering_inactives());

    _.times(30, (i) => {
        const name = "random" + i.toString();
        const stream_id = 100 + i;

        const sub = {
            name,
            subscribed: true,
            newly_subscribed: false,
            stream_id,
        };
        stream_data.add_sub(sub);
    });
    stream_list_sort.set_filter_out_inactives();

    assert.ok(stream_list_sort.is_filtering_inactives());

    override(
        user_settings,
        "demote_inactive_streams",
        settings_config.demote_inactive_streams_values.never.code,
    );
    stream_list_sort.set_filter_out_inactives();
    assert.ok(!stream_list_sort.is_filtering_inactives());
    // Even inactive channels are marked active.
    assert.ok(!pneumonia.is_recently_active);
    assert.ok(stream_list_sort.has_recent_activity(pneumonia));
});

test("initialize", ({override}) => {
    override(user_settings, "demote_inactive_streams", 1);
    stream_list_sort.initialize();

    assert.ok(!stream_list_sort.is_filtering_inactives());
});

test("navigate rows",() => {
    stream_data.add_sub(scalene);
    stream_data.add_sub(fast_tortoise);
    stream_data.add_sub(pneumonia);
    stream_data.add_sub(clarinet);
    stream_data.add_sub(weaving);
    stream_data.add_sub(stream_hyphen_underscore_slash_colon);
    stream_data.add_sub(muted_active);
    stream_data.add_sub(muted_pinned);
    stream_data.add_sub(archived);

    stream_list_sort.clear_all_rows_for_testing();
    const sections = sort_groups("");
    const all_rows = stream_list_sort.get_all_rows_for_testing();
    console.log(sections)
    assert(all_rows[0].stream_id === scalene.stream_id);
    assert(all_rows[1].stream_id === muted_pinned.stream_id);
    assert(all_rows[2].stream_id === clarinet.stream_id);
    let next_row = stream_list_sort.next_row(all_rows[0], new Set(), new Set(), all_rows[0].stream_id)
    assert.deepEqual(next_row.stream_id, muted_pinned.stream_id);
    console.log(next_row)
    next_row = stream_list_sort.next_row(
        all_rows[0],
        new Set(),
        new Set(["pinned-streams"]),
        all_rows[0].stream_id,
    );
    // `muted_pinned` is skipped this time
    assert.deepEqual(next_row.stream_id, clarinet.stream_id);

    assert.deepEqual(stream_list_sort.next_row(all_rows.at(-1), new Set(), new Set(), all_rows[0].stream_id), undefined);

    console.log(next_row)
})