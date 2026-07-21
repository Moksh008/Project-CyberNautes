# Generates deployable remediation code (bash / ansible / git diff) for selected fixes.

import logging

from .ai_agents import _llm

logger = logging.getLogger(__name__)

FORMAT_INSTRUCTIONS = {
    "bash": "a single POSIX bash script (e.g. package upgrades, ufw firewall rules)",
    "ansible": "an Ansible playbook (YAML)",
    "git_diff": "a unified git diff patching the relevant config/code",
}


def generate_remediation(recommendations: list[dict], fmt: str) -> str:
    """Ask the LLM to emit real remediation code for the selected recommendations."""
    if fmt not in FORMAT_INSTRUCTIONS:
        raise ValueError(f"Unsupported format: {fmt}. Choose one of {list(FORMAT_INSTRUCTIONS)}.")

    prompt = f"""You are a remediation engineer. Produce {FORMAT_INSTRUCTIONS[fmt]} that
implements the following selected security fixes.

Selected recommendations:
{recommendations}

Output ONLY the code/script, no explanation and no markdown fences. Make it directly usable.
"""
    result = _llm().invoke(prompt)
    return result.content
