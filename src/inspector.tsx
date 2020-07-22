import { Inspector, AbstractInspector } from "babylonjs-editor";

import { PublishPreferences } from "./preferences";

export class PublishPreferencesInspector extends AbstractInspector<PublishPreferences> {
    /**
     * Registers the preferences inspector.
     */
    public static Register(): void {
        Inspector.registerObjectInspector({
            ctor: PublishPreferencesInspector,
            ctorNames: ["PublishPreferences"],
            title: "Publish Preferences",
        });
    }

    /**
     * Called on the component did moubnt.
     * @override
     */
    public onUpdate(): void {

    }
}