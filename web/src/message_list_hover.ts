import $ from "jquery";
import assert from "minimalistic-assert";

import * as message_edit from "./message_edit.ts";
import * as message_lists from "./message_lists.ts";
import * as rows from "./rows.ts";
import * as thumbnail from "./thumbnail.ts";
import {user_settings} from "./user_settings.ts";

let $current_message_hover: JQuery | undefined;
export function message_unhover(): void {
    if ($current_message_hover === undefined) {
        return;
    }
    $current_message_hover.removeClass("can-edit-content can-move-message");
    $current_message_hover = undefined;
}

export function message_hover($message_row: JQuery): void {
    // This code is performance-sensitive, so we must perform any DOM updates
    // together. We don't want to trigger reflows multiple times.
    const id = rows.id($message_row);
    assert(message_lists.current !== undefined);
    const message = message_lists.current.get(id);
    assert(message !== undefined);

    if ($current_message_hover && rows.id($current_message_hover) === id) {
        return;
    }

    $current_message_hover = $message_row;

    if (message.locally_echoed) {
        // The actions and reactions icon hover logic is handled entirely by CSS
        return;
    }

    // But the message edit hover icon is determined by whether the message is still editable
    const is_content_editable = message_edit.is_content_editable(message);
    const can_move_message = message_edit.can_move_message(message);
    const args = {
        is_content_editable,
        can_move_message,
    };
    const $edit_content = $message_row.find(".edit_content");
    if (args.is_content_editable && !$edit_content.hasClass("can-edit-content")) {
        $edit_content.addClass("can-edit-content");
        $edit_content.removeClass("can-move-message");
        $edit_content.attr("data-tooltip-template-id", "edit-content-tooltip-template");
    } else if (
        !args.is_content_editable &&
        args.can_move_message &&
        !$edit_content.hasClass("can-move-message")
    ) {
        $edit_content.addClass("can-move-message");
        $edit_content.removeClass("can-edit-content");
        $edit_content.attr("data-tooltip-template-id", "move-message-tooltip-template");
    } else if (!args.is_content_editable && !args.can_move_message) {
        $edit_content.removeClass("can-edit-content can-move-message");
    }
}

export function initialize(): void {
    $("#main_div").on("mouseover", ".message-list .message_row", function (this: HTMLElement) {
        const $row = $(this).closest(".message_row");
        message_hover($row);
    });

    $("#main_div").on("mouseleave", ".message-list .message_row", () => {
        message_unhover();
    });

    $("#main_div").on("mouseover", ".sender_info_hover", function (this: HTMLElement) {
        const $row = $(this).closest(".message_row");
        $row.addClass("sender_info_hovered");
    });

    $("#main_div").on("mouseout", ".sender_info_hover", function (this: HTMLElement) {
        const $row = $(this).closest(".message_row");
        $row.removeClass("sender_info_hovered");
    });

    $("#main_div").on(
        "mouseover",
        '.message-list div.message_inline_image img[data-animated="true"]',
        function (this: HTMLElement) {
            if (user_settings.web_animate_image_previews !== "on_hover") {
                return;
            }
            const $img = $(this);
            $img.closest(".message_inline_image").removeClass(
                "message_inline_animated_image_still",
            );
            $img.attr(
                "src",
                $img.attr("src")!.replace(/\/[^/]+$/, "/" + thumbnail.animated_format.name),
            );
        },
    );

    $("#main_div").on(
        "mouseout",
        '.message-list div.message_inline_image img[data-animated="true"]',
        function (this: HTMLElement) {
            if (user_settings.web_animate_image_previews !== "on_hover") {
                return;
            }
            const $img = $(this);
            $img.closest(".message_inline_image").addClass("message_inline_animated_image_still");
            $img.attr(
                "src",
                $img.attr("src")!.replace(/\/[^/]+$/, "/" + thumbnail.preferred_format.name),
            );
        },
    );

    $("body").on("mouseover", ".message_edit_content", function () {
        $(this).closest(".message_row").find(".copy_message").show();
    });

    $("body").on("mouseout", ".message_edit_content", function () {
        $(this).closest(".message_row").find(".copy_message").hide();
    });

    $("body").on("mouseenter", ".copy_message", function () {
        $(this).show();
    });
}
