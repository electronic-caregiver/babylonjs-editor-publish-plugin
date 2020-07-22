import * as React from "react";
// import { Menu, MenuItem } from "@blueprintjs/core";
// import { GLTF2Export } from "babylonjs-serializers";

import { Editor } from "babylonjs-editor";

import { PublishDialog } from "./dialog";

export interface IToolbarProps {
  /**
   * Defines the reference to the editor.
   */
  editor: Editor;
}

export interface IToolbarState {
  isOpen: boolean;
}

// let _isOpen = false;

export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {
  public state: IToolbarState = {
    isOpen: true,
  };

  /**
   * Renders the component.
   */
  public render(): React.ReactNode {
    return (
      <PublishDialog editor={this.props.editor} isOpen={this.state.isOpen} key={"publish-dialog"} handleInvisible={() => this._handleInvisible()} handleVisible={() => this._handleVisible()} />
      );
  }

  private _handleVisible(): void {
    this.setState({
      isOpen: true,
    });
  }

  private _handleInvisible(): void {
    this.setState({
      isOpen: false,
    });
  }
}
