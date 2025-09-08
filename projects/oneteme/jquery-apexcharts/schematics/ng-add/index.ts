import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { updateWorkspace } from '@schematics/angular/utility/workspace';

interface NgAddOptions {
  project?: string;
}

export function ngAdd(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('Adding @oneteme/jquery-apexcharts to your project...');

    return addStylesToAngularJson(tree, context, options);
  };
}

function addStylesToAngularJson(tree: Tree, context: SchematicContext, options: NgAddOptions): Rule {
  return updateWorkspace((workspace) => {
    const projectName = options.project || (workspace.extensions.defaultProject as string);

    if (!projectName) {
      throw new Error('No project found. Please specify a project name.');
    }

    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new Error(`Project "${projectName}" not found.`);
    }

    const buildTarget = project.targets.get('build');
    if (!buildTarget) {
      throw new Error(`Build target not found for project "${projectName}".`);
    }

    const styles = (buildTarget.options?.['styles'] as string[]) || [];
    const styleToAdd = 'node_modules/@oneteme/jquery-apexcharts/assets/styles/styles.scss';

    if (!styles.includes(styleToAdd)) {
      styles.push(styleToAdd);
      buildTarget.options = { ...buildTarget.options, styles };

      context.logger.info('@oneteme/jquery-apexcharts styles have been added to your angular.json');
      context.logger.info('You can now use the ApexCharts directives in your components!');
    } else {
      context.logger.info('@oneteme/jquery-apexcharts styles are already configured in your project.');
    }
  });
}
